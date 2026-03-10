require('dotenv').config({ path: '.env' });
const { neon } = require('@neondatabase/serverless');

async function main() {
    console.log('Iniciando configuração do banco de dados Neon...');
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
        console.error('ERRO: DATABASE_URL não encontrada no .env');
        process.exit(1);
    }

    const sql = neon(databaseUrl);

    try {
        console.log('Criando tabela users...');
        await sql`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(100) NOT NULL,
                last_name VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                plan VARCHAR(50) DEFAULT 'free',
                stripe_customer_id VARCHAR(255),
                stripe_subscription_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;

        console.log('Criando tabela projects...');
        await sql`
            CREATE TABLE IF NOT EXISTS projects (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'draft',
                script_data JSONB,
                config JSONB,
                grid_images TEXT[],
                refined_images TEXT[],
                videos TEXT[],
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
            )
        `;

        console.log('Criando tabela characters...');
        await sql`
            CREATE TABLE IF NOT EXISTS characters (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                reference_image TEXT,
                created_at TIMESTAMP DEFAULT NOW()
            )
        `;

        console.log('✅ Banco de dados configurado com sucesso! Todas as tabelas foram criadas.');
    } catch (error) {
        console.error('❌ Erro ao configurar o banco de dados:', error);
    }
}

main();
