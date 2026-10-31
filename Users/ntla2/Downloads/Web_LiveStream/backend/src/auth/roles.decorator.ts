import { SetMetadata } from '@nestjs/common';

export const Roles = (...roles: string[]) => SetMetadata('roles', roles);

// Route ai cũng gọi được (health check, tra cứu đơn của khách)
export const Public = () => SetMetadata('isPublic', true);

// Route extension Chrome gọi thẳng lên backend bằng header x-extension-token
export const ExtensionAccess = () => SetMetadata('extensionAccess', true);
