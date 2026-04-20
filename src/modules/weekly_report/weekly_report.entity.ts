import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class WeeklyReport {
  @PrimaryColumn()
  id!: number;

  @Column({ type: 'integer' })
  week!: number;

  @Column({ type: 'varchar' })
  content!: string;

  @Column({ type: 'integer' })
  feeling!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}
