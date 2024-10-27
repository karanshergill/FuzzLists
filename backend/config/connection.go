package db

import (
	"context"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/joho/godotenv"
)

// InitializeDB initializes the connection pool with pgx
func InitializeDB() *pgxpool.Pool {
	// Load environment variables from the .env file
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file: %v", err)
	}

	// Get environment variables
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbHost := os.Getenv("DB_HOST")
	dbName := os.Getenv("DB_NAME")
	dbSchema := os.Getenv("DB_SCHEMA")
	sslMode := os.Getenv("SSL_MODE")
	dbPoolMaxConns := os.Getenv("DB_POOL_MAX_CONNS")

	// Set the max number of connections from the env variable
	maxConns, err := strconv.Atoi(dbPoolMaxConns)
	if err != nil {
		log.Fatalf("Invalid max connections value: %v", err)
	}

	// Construct the connection string
	connectionString := fmt.Sprintf(
		"postgresql://%s:%s@%s/%s:%s?sslmode=%s",
		dbUser, dbPassword, dbHost, dbName, dbSchema, sslMode,
	)

	// Set up pgxpool configuration
	config, err := pgxpool.ParseConfig(connectionString)
	if err != nil {
		log.Fatalf("Unable to parse connection string: %v", err)
	}

	config.MaxConns = int32(maxConns)
	config.MinConns = 1
	config.MaxConnIdleTime = 5 * time.Minute

	// Establish a connection pool
	dbpool, err := pgxpool.New(context.Background(), config.ConnString())
	if err != nil {
		log.Fatalf("Unable to create connection pool: %v", err)
	}

	// Check if the connection works
	err = dbpool.Ping(context.Background())
	if err != nil {
		log.Fatalf("Unable to connect to the database: %v", err)
	}

	log.Println("Successfully connected to the database with pgxpool!")
	return dbpool
}
