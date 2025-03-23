// 環境変数の型定義
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // AWS 関連設定
      AWS_REGION: string;
      AWS_ACCESS_KEY_ID: string;
      AWS_SECRET_ACCESS_KEY: string;
      
      // S3 設定
      S3_BUCKET_NAME: string;
      
      // DynamoDB 設定
      DYNAMODB_TABLE_NAME: string;
      
      // Cognito 設定
      COGNITO_USER_POOL_ID: string;
      COGNITO_CLIENT_ID: string;
      COGNITO_IDENTITY_POOL_ID: string;
      
      // API Keys
      ASSEMBLY_AI_API_KEY: string;
      GEMINI_API_KEY: string;
      
      // アプリケーション設定
      NEXT_PUBLIC_APP_URL: string;
      NEXT_PUBLIC_API_URL: string;
    }
  }
} 