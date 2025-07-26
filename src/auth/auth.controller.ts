import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { Roles } from "./decorators/roles.decorator";
import { Role } from "@prisma/client";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "User login" })
  @ApiResponse({ status: 200, description: "Login successful" })
  @ApiResponse({ status: 401, description: "Invalid credentials" })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post("register/self")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "User self-registration" })
  @ApiResponse({ status: 201, description: "Registration successful" })
  @ApiResponse({ status: 401, description: "Invalid email domain" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async registerSelf(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto, null); // No authenticated user
  }

  @Post("register")
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin creates a new user account" })
  @ApiResponse({ status: 201, description: "Registration successful" })
  @ApiResponse({ status: 401, description: "Unauthorized or invalid email domain" })
  @ApiResponse({ status: 403, description: "Forbidden (only admins can create accounts)" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async register(@Body() registerDto: RegisterDto, @Request() req) {
    return this.authService.register(registerDto, req.user);
  }

    @Post("admin/create-account")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin creates account for Editor/Admin" })
  @ApiResponse({ status: 201, description: "Account created successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized or invalid email domain" })
  @ApiResponse({ status: 403, description: "Forbidden (only admins can create accounts)" })
  @ApiResponse({ status: 409, description: "User already exists" })
  async createAccount(@Body() registerDto: RegisterDto, @Request() req) {
    return this.authService.createAccount(registerDto, req.user);
  }

  @Get("profile")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get user profile" })
  @ApiResponse({ status: 200, description: "Profile retrieved successfully" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getProfile(@Request() req) {
    return this.authService.getProfile(req.user.sub);
  }
}
