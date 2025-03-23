# AWS Lambda 音声ファイル分割処理サンプルコード

議事録くんの実装における大きな音声ファイル処理のためのLambda関数サンプルコードです。
AWS Lambda、S3、Step Functionsを使って、大きな音声ファイルを分割し、並列処理する方法を示しています。

## 1. FFmpegで音声分割するLambda関数

```javascript
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');

const s3 = new S3Client({ region: 'ap-northeast-1' }); // 東京リージョン

exports.handler = async (event) => {
    // S3イベントからバケット名とキー取得
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));
    const fileName = path.basename(key);
    
    // 一時ファイルパス
    const tempInputPath = `/tmp/${fileName}`;
    const segmentPrefix = `/tmp/segment_`;
    
    try {
        // S3からファイルダウンロード
        const { Body } = await s3.send(new GetObjectCommand({
            Bucket: bucket,
            Key: key
        }));
        
        // Bodyはストリームなのでファイルに書き込む
        fs.writeFileSync(tempInputPath, await streamToBuffer(Body));
        
        // FFmpegでファイル情報取得
        const durationResult = spawnSync('/opt/ffmpeg/ffmpeg', [
            '-i', tempInputPath,
            '-hide_banner'
        ], { encoding: 'utf-8', stderr: true });
        
        // 正規表現で長さ抽出
        const durationMatch = durationResult.stderr.match(/Duration: (\d{2}):(\d{2}):(\d{2})/);
        if (!durationMatch) throw new Error('音声ファイルの長さを取得できませんでした');
        
        const hours = parseInt(durationMatch[1]);
        const minutes = parseInt(durationMatch[2]);
        const seconds = parseInt(durationMatch[3]);
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
        // 5分(300秒)ごとに分割
        const segmentLength = 300; // 5分
        const segmentCount = Math.ceil(totalSeconds / segmentLength);
        const segments = [];
        
        for (let i = 0; i < segmentCount; i++) {
            const startTime = i * segmentLength;
            const segmentFileName = `segment_${i.toString().padStart(3, '0')}.mp3`;
            const segmentPath = `/tmp/${segmentFileName}`;
            
            // FFmpegで分割
            spawnSync('/opt/ffmpeg/ffmpeg', [
                '-i', tempInputPath,
                '-ss', startTime.toString(),
                '-t', segmentLength.toString(),
                '-c:a', 'libmp3lame',
                '-b:a', '128k',
                segmentPath
            ]);
            
            // S3にアップロード
            const segmentKey = `segments/${path.parse(fileName).name}/${segmentFileName}`;
            await s3.send(new PutObjectCommand({
                Bucket: bucket,
                Key: segmentKey,
                Body: fs.readFileSync(segmentPath)
            }));
            
            segments.push({
                segmentKey,
                startTime,
                order: i
            });
            
            // 一時ファイル削除
            fs.unlinkSync(segmentPath);
        }
        
        // メタデータ保存
        await s3.send(new PutObjectCommand({
            Bucket: bucket,
            Key: `segments/${path.parse(fileName).name}/metadata.json`,
            Body: JSON.stringify({
                originalFile: key,
                segments: segments,
                totalDuration: totalSeconds
            }),
            ContentType: 'application/json'
        }));
        
        // 一時ファイル削除
        fs.unlinkSync(tempInputPath);
        
        // Step Functionsの次ステップを呼び出すためにセグメント情報を返す
        return {
            status: 'success',
            originalFile: key,
            segmentCount: segmentCount,
            segments: segments
        };
    } catch (error) {
        console.error('エラー:', error);
        return {
            status: 'error',
            message: error.message
        };
    }
};

// ストリームをバッファに変換
async function streamToBuffer(stream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', reject);
    });
}
```

## 2. Step Functionsで並列処理するワークフロー定義

```json
{
  "Comment": "音声ファイル分割・処理・結合ワークフロー",
  "StartAt": "分割処理",
  "States": {
    "分割処理": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ap-northeast-1:ACCOUNT_ID:function:splitAudio",
      "Next": "並列文字起こし処理"
    },
    "並列文字起こし処理": {
      "Type": "Map",
      "ItemsPath": "$.segments",
      "MaxConcurrency": 5,
      "Iterator": {
        "StartAt": "セグメント文字起こし",
        "States": {
          "セグメント文字起こし": {
            "Type": "Task",
            "Resource": "arn:aws:lambda:ap-northeast-1:ACCOUNT_ID:function:transcribeSegment",
            "End": true
          }
        }
      },
      "Next": "結果結合処理"
    },
    "結果結合処理": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ap-northeast-1:ACCOUNT_ID:function:combineResults",
      "Next": "要約生成"
    },
    "要約生成": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:ap-northeast-1:ACCOUNT_ID:function:generateSummary",
      "End": true
    }
  }
}
```

## 3. 文字起こし結果を結合するLambda関数

```javascript
const { S3Client, GetObjectCommand, PutObjectCommand } = require('@aws-sdk/client-s3');
const s3 = new S3Client({ region: 'ap-northeast-1' });

exports.handler = async (event) => {
    try {
        // 前のステップから分割情報を取得
        const segmentResults = event.map(segmentResult => {
            return {
                transcription: segmentResult.transcription,
                startTime: segmentResult.segment.startTime,
                order: segmentResult.segment.order
            };
        });
        
        // 順番にソート
        segmentResults.sort((a, b) => a.order - b.order);
        
        // テキスト結合
        let combinedTranscription = '';
        for (const result of segmentResults) {
            // タイムスタンプ付きで結合（オプション）
            const timeStr = formatTime(result.startTime);
            combinedTranscription += `[${timeStr}] ${result.transcription}\n\n`;
        }
        
        // 原ファイル情報取得
        const originalFile = event[0].originalFile;
        const fileNameWithoutExt = originalFile.split('/').pop().split('.')[0];
        
        // 結合結果をS3に保存
        await s3.send(new PutObjectCommand({
            Bucket: 'gijiroku-processed-data',
            Key: `transcriptions/${fileNameWithoutExt}.txt`,
            Body: combinedTranscription,
            ContentType: 'text/plain'
        }));
        
        return {
            status: 'success',
            originalFile,
            combinedTranscriptionKey: `transcriptions/${fileNameWithoutExt}.txt`,
            transcriptionLength: combinedTranscription.length
        };
    } catch (error) {
        console.error('エラー:', error);
        return {
            status: 'error',
            message: error.message
        };
    }
};

// 秒数をHH:MM:SS形式に変換
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

## 4. DynamoDBに保存する例

```javascript
// DynamoDBに保存例
await dynamoDb.put({
    TableName: 'GijirokuTable',
    Item: {
        userId: 'user-123',
        recordingId: 'rec-' + Date.now(),
        title: fileName,
        transcriptionKey: `transcriptions/${fileNameWithoutExt}.txt`,
        summaryKey: `summaries/${fileNameWithoutExt}.txt`,
        originalAudioKey: originalFile,
        duration: totalSeconds,
        createdAt: new Date().toISOString()
    }
});
```

## 5. Next.jsでの表示例

```typescript
// app/recordings/[id]/page.tsx
// SSRでデータ取得
export async function generateMetadata({ params }) {
  const { id } = params;
  const recording = await getRecordingById(id);
  
  return {
    title: `議事録: ${recording.title}`,
  };
}

async function getRecordingById(id) {
  // API Gateway経由でDynamoDB取得
  const response = await fetch(`${process.env.API_URL}/recordings/${id}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return response.json();
}

export default async function RecordingPage({ params }) {
  const { id } = params;
  const recording = await getRecordingById(id);
  const transcription = await getTranscriptionContent(recording.transcriptionKey);
  const summary = await getSummaryContent(recording.summaryKey);
  
  return (
    <div>
      <h1>{recording.title}</h1>
      <div className="summary">
        <h2>要約</h2>
        <p>{summary}</p>
      </div>
      <div className="transcription">
        <h2>文字起こし全文</h2>
        <pre>{transcription}</pre>
      </div>
    </div>
  );
}
```

## 実装ポイント

1. **Lambda関数のデプロイ注意点**:
   - FFmpegはLambdaレイヤーとして追加する必要がある
   - メモリサイズは処理速度に影響（512MB以上推奨）
   - タイムアウト設定は最大15分まで延長可能

2. **S3のイベント通知設定**:
   ```bash
   aws s3api put-bucket-notification-configuration \
     --bucket gijiroku-audio-files \
     --notification-configuration '{
       "LambdaFunctionConfigurations": [
         {
           "LambdaFunctionArn": "arn:aws:lambda:ap-northeast-1:ACCOUNT_ID:function:splitAudio",
           "Events": ["s3:ObjectCreated:*"],
           "Filter": {
             "Key": {
               "FilterRules": [
                 {
                   "Name": "suffix",
                   "Value": ".mp3"
                 }
               ]
             }
           }
         }
       ]
     }'
   ```

3. **注意点と制限**:
   - Lambdaの`/tmp`ディレクトリは512MBの容量制限がある
   - S3 -> Lambda直接トリガーでは6MB制限（それ以上はS3イベント -> SNS -> Lambda推奨）
   - 並列処理数はコスト・速度のバランスを考慮して調整（MaxConcurrencyパラメータ） 