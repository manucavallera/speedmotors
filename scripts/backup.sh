#!/bin/bash
# Backup PostgreSQL via docker exec. Guardar en scripts/backups/
# Uso: ./scripts/backup.sh
# Cron diario a las 3am: 0 3 * * * /ruta/speedmotors/scripts/backup.sh

set -e

BACKUP_DIR="$(dirname "$0")/backups"
mkdir -p "$BACKUP_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILE="$BACKUP_DIR/speedmotors_${TIMESTAMP}.sql.gz"

docker exec speedmotors-db pg_dump -U speedmotors speedmotors | gzip > "$FILE"

echo "Backup guardado: $FILE"

# Borrar backups con más de 30 días
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
