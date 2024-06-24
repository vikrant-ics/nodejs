# qod-api

Quote of the Day API

### Ports
This API service listens on port `8080`. Please set the service to use port 8080, either when deploying from Dockerfile or Source-to-image, or by editing the service definition after deployment. This is the default port used for most OpenShift deployment.

### Environment Varaiables
Required environment variables that are required to connect to the database tier:
- **DB_HOST** - the hostname or IP address of the database instance, assuming use of port 3306 (In case of OpenShift, use service name of the qod-db deployment)
- **DB_USER** - the username of a user with access to the database (qod-db deployment uses `user`)
- **DB_PASS** - the password for the user above (qod-db deployment uses `pass`)
