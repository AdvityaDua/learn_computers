import { COLORS } from '../../lib/constants';

export const mdStyles = {
  body: { color: COLORS.text, fontSize: 15, lineHeight: 24 },
  heading1: { fontSize: 22, fontWeight: '900' as const, color: COLORS.text, marginBottom: 12, marginTop: 16 },
  heading2: { fontSize: 18, fontWeight: '800' as const, color: COLORS.text, marginBottom: 10, marginTop: 14 },
  heading3: { fontSize: 16, fontWeight: '700' as const, color: COLORS.text, marginBottom: 8, marginTop: 12 },
  paragraph: { marginBottom: 12, color: COLORS.text, lineHeight: 24 },
  code_inline: { backgroundColor: COLORS.surfaceSoft, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, fontFamily: 'monospace', fontSize: 14, color: COLORS.primary },
  fence: { backgroundColor: '#0F172A', borderRadius: 12, padding: 16, marginVertical: 12, color: '#E2E8F0', fontFamily: 'monospace', fontSize: 13 },
  code_block: { backgroundColor: '#0F172A', color: '#E2E8F0', fontFamily: 'monospace', fontSize: 13, lineHeight: 20 },
  blockquote: { borderLeftWidth: 4, borderLeftColor: COLORS.primary, paddingLeft: 14, marginLeft: 0, opacity: 0.9, backgroundColor: COLORS.primaryLight, paddingVertical: 8, paddingRight: 8, borderRadius: 4 },
  bullet_list: { marginBottom: 12 },
  ordered_list: { marginBottom: 12 },
  list_item: { marginBottom: 6, lineHeight: 24 },
  strong: { fontWeight: '800' as const, color: COLORS.text },
  em: { fontStyle: 'italic' as const },
  link: { color: COLORS.primary, textDecorationLine: 'underline' as const, fontWeight: '600' as const },
  hr: { backgroundColor: COLORS.border, height: 1, marginVertical: 16 },
  table: { borderWidth: 1, borderColor: COLORS.border, borderRadius: 8, marginVertical: 12 },
  th: { backgroundColor: COLORS.surfaceSoft, fontWeight: '800' as const, padding: 10, borderBottomWidth: 1, borderColor: COLORS.border },
  td: { padding: 10, borderBottomWidth: 1, borderColor: COLORS.border },
};
