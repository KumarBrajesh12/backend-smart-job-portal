/** SMTP transport options compatible with nodemailer.createTransport */
export interface NodemailerSmtpOptions {
  host?: string;
  port?: number;
  secure?: boolean;
  service?: string;
  auth?: {
    user: string;
    pass: string;
  };
  requireTLS?: boolean;
  tls?: {
    minVersion?: string;
  };
}
