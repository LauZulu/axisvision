import { config } from 'dotenv'

// Carga .env y luego .env.local con prioridad (igual que Next), para que los
// scripts respeten el override del túnel (localhost:5433) sin tocar el .env.
config({ path: '.env' })
config({ path: '.env.local', override: true })
