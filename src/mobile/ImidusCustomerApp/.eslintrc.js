/**
 * IMIDUS Technologies – React Native ESLint Configuration
 * Brand token enforcement rules.
 *
 * This config ensures colors are always imported from theme tokens.
 * Prevents visual drift by blocking raw hex codes.
 */
module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Block raw hex colors - must use Colors from @/theme
    'no-restricted-syntax': [
      'error',
      {
        selector:
          "Literal[value=/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/]",
        message:
          'Raw hex colors are not allowed. Import colors from @/theme like: import { Colors } from "@/theme"; then use Colors.brandBlue.',
      },
      {
        selector: "CallExpression[callee.name=/^(rgb|rgba|hsl|hsla)$/]",
        message:
          'Raw color functions not allowed. Use Colors from @/theme instead.',
      },
      {
        selector:
          "TemplateElement[value.raw=/#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})/]",
        message:
          'No raw hex colors in template literals. Use @/theme/colors Colors object.',
      },
    ],
  },
};
