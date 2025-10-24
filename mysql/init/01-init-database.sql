#!/bin/bash

# Database initialization script for Docker
# This script will be executed when the MySQL container starts for the first time

# Create database if it doesn't exist
mysql -u root -p$MYSQL_ROOT_PASSWORD -e "CREATE DATABASE IF NOT EXISTS restaurant CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create user if it doesn't exist
mysql -u root -p$MYSQL_ROOT_PASSWORD -e "CREATE USER IF NOT EXISTS 'restaurant_user'@'%' IDENTIFIED BY 'restaurant_pass';"

# Grant privileges
mysql -u root -p$MYSQL_ROOT_PASSWORD -e "GRANT ALL PRIVILEGES ON restaurant.* TO 'restaurant_user'@'%';"

# Flush privileges
mysql -u root -p$MYSQL_ROOT_PASSWORD -e "FLUSH PRIVILEGES;"

echo "Database initialization completed successfully!"
