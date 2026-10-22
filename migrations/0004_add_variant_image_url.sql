-- Migration 0004: Add image_url to product_variants table
ALTER TABLE product_variants ADD COLUMN image_url TEXT;
