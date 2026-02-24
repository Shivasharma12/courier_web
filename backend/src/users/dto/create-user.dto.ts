import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
    @ApiProperty()
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    phone: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    password?: string;

    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    role: string;

    @ApiProperty({ required: false, type: [String] })
    @IsArray()
    @IsOptional()
    roles?: string[];

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    hubId?: string;
}

export class UpdateUserDto {
    @ApiProperty({ required: false })
    @IsEmail()
    @IsOptional()
    email?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    phone?: string;

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    role?: string;

    @ApiProperty({ required: false, type: [String] })
    @IsArray()
    @IsOptional()
    roles?: string[];

    @ApiProperty({ required: false })
    @IsString()
    @IsOptional()
    hubId?: string;
}
