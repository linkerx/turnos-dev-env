import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/user.entity';
import { Gestor } from '../gestores/gestor.entity';
import { RegisterDto, UserRole } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Gestor)
    private gestorRepository: Repository<Gestor>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, nombre, telefono, role } = registerDto;

    // Check if user already exists
    if (role === UserRole.USER) {
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new ConflictException('Email already registered');
      }
    } else {
      const existingGestor = await this.gestorRepository.findOne({ where: { email } });
      if (existingGestor) {
        throw new ConflictException('Email already registered');
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user or gestor
    if (role === UserRole.USER) {
      const user = this.userRepository.create({
        email,
        password: hashedPassword,
        nombre,
        telefono,
      });
      await this.userRepository.save(user);

      return {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: UserRole.USER,
      };
    } else {
      const gestor = this.gestorRepository.create({
        email,
        password: hashedPassword,
        nombre,
        telefono,
      });
      await this.gestorRepository.save(gestor);

      return {
        id: gestor.id,
        email: gestor.email,
        nombre: gestor.nombre,
        role: UserRole.GESTOR,
      };
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Try to find user
    let user = await this.userRepository.findOne({ where: { email } });
    let role: 'user' | 'gestor' = 'user';

    if (!user) {
      // Try to find gestor
      const gestor = await this.gestorRepository.findOne({ where: { email } });
      if (!gestor) {
        throw new UnauthorizedException('Invalid credentials');
      }
      user = gestor as any;
      role = 'gestor';
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role,
      },
    };
  }

  async validateUser(userId: string, role: 'user' | 'gestor') {
    if (role === 'user') {
      return this.userRepository.findOne({ where: { id: userId } });
    } else {
      return this.gestorRepository.findOne({ where: { id: userId } });
    }
  }
}
