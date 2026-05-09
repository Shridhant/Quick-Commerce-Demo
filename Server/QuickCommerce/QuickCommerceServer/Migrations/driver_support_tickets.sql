-- Migration: Driver Support Tickets
-- Tables: driver_support_ticket, driver_ticket_attachment

CREATE TABLE IF NOT EXISTS driver_support_ticket (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(100)    NOT NULL UNIQUE,
    driver_id     VARCHAR(100)    NOT NULL,
    category      VARCHAR(100)    NOT NULL,
    message       TEXT            NOT NULL,
    status        VARCHAR(50)     NOT NULL DEFAULT 'OPEN',
    created_at    DATETIME        NOT NULL DEFAULT NOW(),
    updated_at    DATETIME        NOT NULL DEFAULT NOW() ON UPDATE NOW()
);

CREATE TABLE IF NOT EXISTS driver_ticket_attachment (
    id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    ticket_number VARCHAR(100)    NOT NULL,
    filename      VARCHAR(255)    NOT NULL,
    original_name VARCHAR(255),
    created_at    DATETIME        NOT NULL DEFAULT NOW(),
    FOREIGN KEY (ticket_number) REFERENCES driver_support_ticket(ticket_number) ON DELETE CASCADE
);
