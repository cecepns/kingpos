-- Migration: Add Additional Fee Columns to Transactions Table
-- Tanggal: 2026-08-06

ALTER TABLE `transactions`
  ADD COLUMN `additional_fee` decimal(18,2) DEFAULT 0.00 AFTER `tax_amount`,
  ADD COLUMN `additional_fee_name` varchar(128) DEFAULT NULL AFTER `additional_fee`;
