import { IsInt, Min, Max, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class ReportQueryDto {
  @IsInt({ message: 'Mês inicial deve ser um número' })
  @Min(1, { message: 'Mês inicial deve ser entre 1 e 12' })
  @Max(12, { message: 'Mês inicial deve ser entre 1 e 12' })
  @IsNotEmpty({ message: 'Mês inicial é obrigatório' })
  @Type(() => Number)
  startMonth: number;

  @IsInt({ message: 'Ano inicial deve ser um número' })
  @Min(2000, { message: 'Ano inicial deve ser maior que 2000' })
  @IsNotEmpty({ message: 'Ano inicial é obrigatório' })
  @Type(() => Number)
  startYear: number;

  @IsInt({ message: 'Mês final deve ser um número' })
  @Min(1, { message: 'Mês final deve ser entre 1 e 12' })
  @Max(12, { message: 'Mês final deve ser entre 1 e 12' })
  @IsNotEmpty({ message: 'Mês final é obrigatório' })
  @Type(() => Number)
  endMonth: number;

  @IsInt({ message: 'Ano final deve ser um número' })
  @Min(2000, { message: 'Ano final deve ser maior que 2000' })
  @IsNotEmpty({ message: 'Ano final é obrigatório' })
  @Type(() => Number)
  endYear: number;
}
