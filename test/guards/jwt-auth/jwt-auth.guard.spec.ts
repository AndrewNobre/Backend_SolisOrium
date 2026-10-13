import { JwtAuthGuard } from '../../../src/auth/guards/jwt-auth/jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';

describe('JwtAuthGuard', () => {
  it('should be defined', () => {
    const jwtService = {
      verifyAsync: jest.fn(),
    } as unknown as JwtService;

    expect(new JwtAuthGuard(jwtService)).toBeDefined();
  });
});
