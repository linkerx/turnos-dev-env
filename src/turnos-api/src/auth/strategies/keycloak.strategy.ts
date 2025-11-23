import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../users/user.entity';
import { Gestor } from '../../gestores/gestor.entity';

export interface KeycloakPayload {
  sub: string; // Keycloak user ID
  email: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  name?: string;
  email_verified?: boolean;
  realm_access?: {
    roles: string[];
  };
  resource_access?: any;
}

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Gestor)
    private gestorRepository: Repository<Gestor>,
  ) {
    const keycloakUrl = configService.get<string>('KEYCLOAK_URL');
    const keycloakRealm = configService.get<string>('KEYCLOAK_REALM');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      audience: configService.get<string>('KEYCLOAK_CLIENT_ID'),
      issuer: `${keycloakUrl}/realms/${keycloakRealm}`,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${keycloakUrl}/realms/${keycloakRealm}/protocol/openid-connect/certs`,
      }),
    });
  }

  async validate(payload: KeycloakPayload) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    // Buscar usuario por keycloakId primero, luego por email
    let user = await this.userRepository.findOne({
      where: [
        { keycloakId: payload.sub },
        { email: payload.email },
      ],
      relations: ['role', 'role.permissions'],
    });

    let userType: 'user' | 'gestor' = 'user';

    if (!user) {
      // Buscar gestor
      const gestor = await this.gestorRepository.findOne({
        where: [
          { keycloakId: payload.sub },
          { email: payload.email },
        ],
        relations: ['role', 'role.permissions'],
      });

      if (!gestor) {
        throw new UnauthorizedException(
          'User not found in local database. Please contact administrator.',
        );
      }

      // Actualizar keycloakId si no está establecido
      if (!gestor.keycloakId) {
        gestor.keycloakId = payload.sub;
        await this.gestorRepository.save(gestor);
      }

      user = gestor as any;
      userType = 'gestor';
    } else {
      // Actualizar keycloakId si no está establecido
      if (!user.keycloakId) {
        user.keycloakId = payload.sub;
        await this.userRepository.save(user);
      }
    }

    if (!user.role) {
      throw new UnauthorizedException(
        'User has no assigned role. Please contact administrator.',
      );
    }

    // Extraer permisos del rol
    const permissions = user.role.permissions?.map((p) => p.name) || [];

    return {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      keycloakId: payload.sub,
      userType,
      role: user.role,
      permissions,
    };
  }
}
