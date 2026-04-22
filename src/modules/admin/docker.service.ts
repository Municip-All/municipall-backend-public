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

@Injectable()
export class DockerService {
  async getContainers(): Promise<DockerContainer[]> {
    try {
      // Get container list with status
      const { stdout: psOutput } = await execAsync("docker ps -a --format '{{json .}}'");
      const containers = psOutput.trim().split('\n').map(line => {
        try {
          const data = JSON.parse(line);
          return {
            id: data.ID,
            name: data.Names,
            image: data.Image,
            status: data.Status,
            state: data.State, // running, exited, etc.
            uptime: data.Status,
            cpu: '0%', // Will be updated by stats
            memory: '0B / 0B'
          };
        } catch {
          return null;
        }
      }).filter(Boolean) as any[];

      // Get real-time stats (non-blocking, single shot)
      const { stdout: statsOutput } = await execAsync("docker stats --no-stream --format '{{json .}}'");
      const stats = statsOutput.trim().split('\n').map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Merge stats into containers
      return containers.map(container => {
        const stat = stats.find(s => s.ID === container.id || s.Name === container.name);
        if (stat) {
          return {
            ...container,
            cpu: stat.CPUPerc,
            memory: stat.MemUsage
          };
        }
        return container;
      });
    } catch (error) {
      console.error('Docker Monitoring Error:', error);
      // Return mock data if docker command fails (e.g. in dev without docker)
      if (process.env.NODE_ENV !== 'production') {
        return [
          { id: '1', name: 'municipall-backend', image: 'ghcr.io/m-all/backend', status: 'Up 2 hours', state: 'running', uptime: '2h', cpu: '1.2%', memory: '256MiB / 2GiB' },
          { id: '2', name: 'municipall-db', image: 'postgres:15', status: 'Up 5 hours', state: 'running', uptime: '5h', cpu: '0.5%', memory: '128MiB / 1GiB' },
          { id: '3', name: 'municipall-nginx', image: 'nginx-proxy-manager', status: 'Up 1 day', state: 'running', uptime: '1d', cpu: '0.1%', memory: '45MiB / 512MiB' },
        ];
      }
      return [];
    }
  }
}
