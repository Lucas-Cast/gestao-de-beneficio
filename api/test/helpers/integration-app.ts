import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { App } from 'supertest/types';
import { DatabaseService } from '../../src/modules/database/database.service';

export interface IntegrationApp {
  app: INestApplication<App>;
  database: DatabaseService;
  close(): Promise<void>;
}

/** One disposable PostgreSQL instance per suite, never a fallback datasource. */
export async function createIntegrationApp(): Promise<IntegrationApp> {
  let container: StartedPostgreSqlContainer;
  try {
    container = await new PostgreSqlContainer(
      'postgres:18-alpine@sha256:77f585114c32fbca283dc835b0596f4e52b51b4c6662d7810b2f4084f60a1873',
    )
      .withDatabase('gestao_beneficio_test')
      .withStartupTimeout(120_000)
      .start();
  } catch (cause) {
    throw new Error(
      'Não foi possível iniciar o PostgreSQL do Testcontainers. Verifique se o Docker está disponível.',
      { cause },
    );
  }
  const previous = {
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    JWT_SECRET: process.env.JWT_SECRET,
  };
  const restoreEnvironment = () => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  };
  process.env.DATABASE_URL = container.getConnectionUri();
  process.env.DIRECT_URL = container.getConnectionUri();
  process.env.JWT_SECRET = 'integration-tests-only-secret';
  let app: INestApplication<App> | undefined;
  try {
    execFileSync(
      process.execPath,
      [require.resolve('prisma/build/index.js'), 'migrate', 'deploy'],
      {
        cwd: resolve(__dirname, '../..'),
        env: { ...process.env },
        timeout: 120_000,
        stdio: 'pipe',
      },
    );
    // JwtModule reads its secret at module load; import only after setting test env.
    const { AppModule } = await import('../../src/app.module');
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication<INestApplication<App>>();
    await app.init();
    const application = app;
    return {
      app: application,
      database: application.get(DatabaseService),
      async close() {
        try {
          await application.close();
        } finally {
          try {
            await container.stop();
          } finally {
            restoreEnvironment();
          }
        }
      },
    };
  } catch (error) {
    try {
      await app?.close();
    } finally {
      try {
        await container.stop();
      } finally {
        restoreEnvironment();
      }
    }
    throw error;
  }
}

export async function clearFixtures(database: DatabaseService): Promise<void> {
  // This service is constructed only after the helper overwrites both datasource URLs.
  await database.$transaction([
    database.auditLog.deleteMany(),
    database.stockMovement.deleteMany(),
    database.basketDelivery.deleteMany(),
    database.basketSupply.deleteMany(),
    database.supply.deleteMany(),
    database.basket.deleteMany(),
    database.beneficiary.deleteMany(),
    database.address.deleteMany(),
    database.user.deleteMany(),
  ]);
}
