-- Database Schema for Website Desa Mantikole
-- Digitalization & SEO/GEO Platform

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. USERS TABLE (Admin & Perangkat Desa)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. ARTICLES & NEWS TABLE
CREATE TABLE IF NOT EXISTS articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    summary TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Berita', 'Pengumuman', 'Edukasi', 'Pembangunan')),
    featured_image_url VARCHAR(500),
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT true,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. VILLAGE HIGHLIGHTS (WISATA & KOMODITAS)
CREATE TABLE IF NOT EXISTS village_highlights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    slug VARCHAR(150) UNIQUE NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('wisata', 'komoditas')),
    short_description TEXT NOT NULL,
    full_description TEXT NOT NULL,
    location_details VARCHAR(255),
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    price_info VARCHAR(100),
    gallery_urls TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. LETTER TEMPLATES (SURAT ADMINISTRASI DESA)
CREATE TABLE IF NOT EXISTS letter_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    file_url VARCHAR(500) NOT NULL,
    requirements TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. LETTER REQUESTS (PENGAJUAN SURAT WARGA)
CREATE TABLE IF NOT EXISTS letter_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    applicant_nik VARCHAR(16) NOT NULL,
    applicant_name VARCHAR(100) NOT NULL,
    applicant_phone VARCHAR(20) NOT NULL,
    applicant_address TEXT NOT NULL,
    letter_type_code VARCHAR(50) NOT NULL,
    attachment_urls TEXT[],
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'COMPLETED', 'REJECTED')),
    admin_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. AI KNOWLEDGE BASE & EMBEDDINGS
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR PERFORMANCE & SEO CRAWL
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_highlights_slug ON village_highlights(slug);
CREATE INDEX IF NOT EXISTS idx_letter_requests_ticket ON letter_requests(ticket_number);
CREATE INDEX IF NOT EXISTS idx_letter_requests_nik ON letter_requests(applicant_nik);
