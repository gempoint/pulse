use redis::AsyncCommands;
use std::env;
use std::time::{SystemTime, UNIX_EPOCH};
use tokio::time::{interval, Duration};

const REDIS_EXPIRE_KEY: &str = "geo_expire";
const REDIS_GEO_KEY: &str = "user_loc";

#[derive(thiserror::Error, Debug)]
enum WorkerError {
    #[error("Redis error: {0}")]
    Redis(#[from] redis::RedisError),
}

struct Worker {
    client: redis::Client,
}

impl Worker {
    pub fn new(redis_url: &str) -> Result<Self, WorkerError> {
        let client = redis::Client::open(redis_url)?;
        Ok(Self { client })
    }

    async fn expire(&self) -> Result<(), WorkerError> {
        let mut conn = self.client.get_async_connection().await?;

        // Get current Unix timestamp
        let current_time = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_secs() as i64;

        // Get expired locations
        let expired_locations: Vec<String> = conn
            .zrangebyscore(REDIS_EXPIRE_KEY, 0, current_time)
            .await?;

        for location in expired_locations {
            // Remove from geo set
            conn.zrem(REDIS_GEO_KEY, &location).await?;
            tracing::info!(location = %location, "Removed location from geo set");

            // Remove from expiration set
            conn.zrem(REDIS_EXPIRE_KEY, &location).await?;
        }

        Ok(())
    }
}

#[tokio::main]
async fn main() -> Result<(), WorkerError> {
    // Initialize logging
    tracing_subscriber::fmt::init();

    // Load environment variables
    dotenv::dotenv().ok();

    // Initialize Sentry
    let _guard = sentry::init(sentry::ClientOptions {
        dsn: env::var("SENTRY_DSN").ok().map(|dsn| dsn.parse().unwrap()),
        debug: true,
        max_breadcrumbs: 50,
        ..Default::default()
    });

    // Initialize Redis worker
    let redis_url = env::var("REDIS_URL").unwrap_or_else(|_| "redis://127.0.0.1:6379".to_string());
    let worker = Worker::new(&redis_url)?;

    tracing::info!("initing");

    // Run cleanup every 10 seconds
    let mut interval = interval(Duration::from_secs(10));

    loop {
        interval.tick().await;
        if let Err(e) = worker.expire().await {
            sentry::capture_error(&e);
            tracing::error!(error = ?e, "Error during cleanup");
        }
    }
}
