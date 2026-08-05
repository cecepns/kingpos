-- ===================================================
-- MIGRASI DATABASE KING POS - TIERED PRICING & VARIANTS
-- File: sql/migration_wholesale_and_variants.sql
-- ===================================================

-- 1. Tambah kolom harga grosir & min qty di tabel products
ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `wholesale_price` DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER `sell_price`,
  ADD COLUMN IF NOT EXISTS `wholesale_min_qty` INT NOT NULL DEFAULT 0 AFTER `wholesale_price`;

-- 2. Buat tabel varian produk (product_variants)
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT UNSIGNED NOT NULL,
  `name` VARCHAR(128) NOT NULL,
  `sku` VARCHAR(64) DEFAULT NULL,
  `barcode` VARCHAR(64) DEFAULT NULL,
  `sell_price` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `wholesale_price` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `wholesale_min_qty` INT NOT NULL DEFAULT 0,
  `stock` INT NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY `idx_pv_product` (`product_id`),
  CONSTRAINT `fk_pv_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tambah kolom variant_id & variant_name di tabel transaction_items
ALTER TABLE `transaction_items`
  ADD COLUMN IF NOT EXISTS `variant_id` INT UNSIGNED DEFAULT NULL AFTER `product_id`,
  ADD COLUMN IF NOT EXISTS `variant_name` VARCHAR(128) DEFAULT NULL AFTER `product_name`;
