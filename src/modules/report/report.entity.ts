import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Report {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'integer' })
  user_id!: number;

  @Column({ type: 'varchar' })
  content!: string;

  @Column({ type: 'varchar' })
  services!: string;

  @Column({ type: 'varchar' })
  states!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @Column({ type: 'numeric' })
  lat!: number;

  @Column({ type: 'numeric' })
  lon!: number;
}
