import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import path from 'path';
import { Application } from 'express';

export default function setupSwagger(app: Application): void {
    const swaggerDocument = YAML.load(path.join(process.cwd(), 'src/docs/swagger.yaml'));

    // Paths
    const authPaths = YAML.load(path.join(process.cwd(), 'src/docs/paths/auth.yaml'));
    const profilePaths = YAML.load(path.join(process.cwd(), 'src/docs/paths/profile.yaml'));
    const mulchRequestPaths = YAML.load(path.join(process.cwd(), 'src/docs/paths/mulch-request.yaml'));
    const workItemPaths = YAML.load(path.join(process.cwd(), 'src/docs/paths/work-item.yaml'));
    const estimatePaths = YAML.load(path.join(process.cwd(), 'src/docs/paths/estimate.yaml'));
    const invoicePaths = YAML.load(path.join(process.cwd(), 'src/docs/paths/invoice.yaml'));

    // Schemas
    const authSchemas = YAML.load(path.join(process.cwd(), 'src/docs/schemas/auth.yaml'));
    const mulchRequestSchemas = YAML.load(path.join(process.cwd(), 'src/docs/schemas/mulch-request.yaml'));
    const workItemSchemas = YAML.load(path.join(process.cwd(), 'src/docs/schemas/work-item.yaml'));
    const estimateSchemas = YAML.load(path.join(process.cwd(), 'src/docs/schemas/estimate.yaml'));

    // Merge paths
    swaggerDocument.paths = {
        ...(swaggerDocument.paths || {}),
        ...authPaths,
        ...profilePaths,
        ...mulchRequestPaths,
        ...workItemPaths,
        ...estimatePaths,
        ...invoicePaths
    };

    // Merge schemas
    swaggerDocument.components = {
        ...(swaggerDocument.components || {}),

        schemas: {
            ...(swaggerDocument.components?.schemas || {}),
            ...authSchemas,
            ...mulchRequestSchemas,
            ...workItemSchemas,
            ...estimateSchemas
        }
    };

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
}
