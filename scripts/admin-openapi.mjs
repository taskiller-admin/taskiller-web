// Keep staff operations and their transitive schema references together.
export function adminOpenapi(source) {
  const paths = Object.fromEntries(Object.entries(source.paths).filter(([path]) => path.startsWith('/api/v1/admin/')));
  if (!paths['/api/v1/admin/me']) throw new Error('The source contract has no staff session endpoint');
  const components = {};
  function visit(value) {
    if (!value || typeof value !== 'object') return;
    if (typeof value.$ref === 'string' && value.$ref.startsWith('#/components/')) {
      const [, , kind, name] = value.$ref.split('/');
      const group = components[kind] ??= {};
      if (!Object.hasOwn(group, name)) {
        const definition = source.components?.[kind]?.[name];
        if (!definition) throw new Error(`Missing admin contract reference ${value.$ref}`);
        group[name] = definition;
        visit(definition);
      }
    }
    for (const child of Object.values(value)) visit(child);
  }
  visit(paths);
  const staffCookie = source.components?.securitySchemes?.staffCookie;
  if (!staffCookie) throw new Error('Missing staff cookie scheme');
  components.securitySchemes = { staffCookie };
  return { openapi: source.openapi, info: source.info, paths, components };
}
