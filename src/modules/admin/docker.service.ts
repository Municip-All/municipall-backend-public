import { Injectable } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface DockerContainer {
  id: string;
  name: string;
  image: string;
  status: string;
  state: string;
  uptime: string;
  cpu: string;
  memory: string;
}

interface DockerPsOutput {
  ID: string;
  Names: string;
  Image: string;
  Status: string;
  State: string;
}

interface DockerStatsOutput {
  ID: string;
  Name: string;
  CPUPerc: string;
  MemUsage: string;
}

@Injectable()
export class DockerService {
  async getContainers(): Promise<DockerContainer[]> {
    try {
      // Get container list with status
      const { stdout: psOutput } = await execAsync("docker ps -a --format '{{json .}}'");
      const containers: DockerContainer[] = psOutput
        .trim()
        .split('\n')
        .map((line) => {
          try {
            if (!line) return null;
            const data = JSON.parse(line) as DockerPsOutput;
            return {
              id: data.ID,
              name: data.Names,
              image: data.Image,
              status: data.Status,
              state: data.State,
              uptime: data.Status,
              cpu: '0%',
              memory: '0B / 0B',
            };
          } catch {
            return null;
          }
        })
        .filter((c): c is DockerContainer => c !== null);

      // Get real-time stats
      const { stdout: statsOutput } = await execAsync(
        "docker stats --no-stream --format '{{json .}}'",
      );
      const stats: DockerStatsOutput[] = statsOutput
        .trim()
        .split('\n')
        .map((line) => {
          try {
            if (!line) return null;
            return JSON.parse(line) as DockerStatsOutput;
          } catch {
            return null;
          }
        })
        .filter((s): s is DockerStatsOutput => s !== null);

      // Merge stats into containers
      return containers.map((container) => {
        const stat = stats.find((s) => s.ID === container.id || s.Name === container.name);
        if (stat) {
          return {
            ...container,
            cpu: stat.CPUPerc,
            memory: stat.MemUsage,
          };
        }
        return container;
      });
    } catch (error) {
      console.error('Docker Monitoring Error:', error);
      if (process.env.NODE_ENV !== 'production') {
        return [
          {
            id: '1',
            name: 'municipall-backend',
            image: 'ghcr.io/m-all/backend',
            status: 'Up 2 hours',
            state: 'running',
            uptime: '2h',
            cpu: '1.2%',
            memory: '256MiB / 2GiB',
          },
          {
            id: '2',
            name: 'municipall-db',
            image: 'postgres:15',
            status: 'Up 5 hours',
            state: 'running',
            uptime: '5h',
            cpu: '0.5%',
            memory: '128MiB / 1GiB',
          },
          {
            id: '3',
            name: 'municipall-nginx',
            image: 'nginx-proxy-manager',
            status: 'Up 1 day',
            state: 'running',
            uptime: '1d',
            cpu: '0.1%',
            memory: '45MiB / 512MiB',
          },
        ];
      }
      return [];
    }
  }
}
