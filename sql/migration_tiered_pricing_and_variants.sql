-- ===================================================
-- MIGRASI DATABASE KING POS - HARGA BERTINGKAT (MULTI-TIER PRICING) & VARIAN
-- File: sql/migration_tiered_pricing_and_variants.sql
-- ===================================================

-- 1. Tambah tabel harga bertingkat produk (product_tiers)
-- Mendukung banyak tingkat harga (misal: 1 pcs Rp 3.500, 5 pcs Rp 3.400, 10 pcs ke atas Rp 3.300)
CREATE TABLE IF NOT EXISTS `product_tiers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `product_id` INT UNSIGNED NOT NULL,
  `min_qty` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_pt_product` (`product_id`),
  CONSTRAINT `fk_pt_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Tambah tabel harga bertingkat khusus varian (variant_tiers)
CREATE TABLE IF NOT EXISTS `variant_tiers` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `variant_id` INT UNSIGNED NOT NULL,
  `min_qty` INT NOT NULL DEFAULT 1,
  `price` DECIMAL(18,2) NOT NULL DEFAULT 0.00,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  KEY `idx_vt_variant` (`variant_id`),
  CONSTRAINT `fk_vt_variant` FOREIGN KEY (`variant_id`) REFERENCES `product_variants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Tambah kolom pendukung di tabel products
ALTER TABLE `products`
  ADD COLUMN IF NOT EXISTS `wholesale_price` DECIMAL(18,2) NOT NULL DEFAULT 0.00 AFTER `sell_price`,
  ADD COLUMN IF NOT EXISTS `wholesale_min_qty` INT NOT NULL DEFAULT 0 AFTER `wholesale_price`;

-- 4. Tambah tabel varian produk (product_variants)
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

-- 5. Tambah kolom variant_id & variant_name di tabel transaction_items
ALTER TABLE `transaction_items`
  ADD COLUMN IF NOT EXISTS `variant_id` INT UNSIGNED DEFAULT NULL AFTER `product_id`,
  ADD COLUMN IF NOT EXISTS `variant_name` VARCHAR(128) DEFAULT NULL AFTER `product_name`;
