import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Alert, Text, TouchableOpacity, View } from 'react-native';
import Markdown from 'react-native-markdown-display';
import PieChart from 'react-native-pie-chart';
import { submitQuizAnswers } from '../../lib/api';
import { COLORS } from '../../lib/constants';
import { mdStyles } from './MarkdownStyles';
import { QuizData } from './types';

export function QuizSection({ item, chapterId, lessonId, score, highlighted, onDone }: {
  item: QuizData; chapterId: string; lessonId: string; score?: number; highlighted?: boolean; onDone: (score: number) => void;
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [skipped, setSkipped] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    score: number;
    correctCount: number;
    incorrectCount: number;
    skippedCount: number;
    totalQuestions: number;
    hasDetailedBreakdown: boolean;
  } | null>(
    score !== undefined
      ? {
          score,
          correctCount: Math.round((score / 100) * item.questions.length),
          incorrectCount: Math.max(0, item.questions.length - Math.round((score / 100) * item.questions.length)),
          skippedCount: 0,
          totalQuestions: item.questions.length,
          hasDetailedBreakdown: false,
        }
      : null
  );

  const submit = async () => {
    try {
      setSubmitting(true);
      const arr = item.questions.map((_, i) => answers[i] ?? -1);
      const res: any = await submitQuizAnswers(chapterId, lessonId, item._id, arr);
      const results = Array.isArray(res?.results) ? res.results : [];
      const skippedCount = results.filter((r: any) => r.userAnswer === -1).length;
      const correctCount = Number(res?.correctCount ?? 0);
      const totalQuestions = Number(res?.totalQuestions ?? item.questions.length);
      const incorrectCount = Math.max(0, totalQuestions - correctCount - skippedCount);

      setResult({
        score: Number(res?.score ?? 0),
        correctCount,
        incorrectCount,
        skippedCount,
        totalQuestions,
        hasDetailedBreakdown: true,
      });
      onDone(res.score);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to submit quiz');
    } finally { setSubmitting(false); }
  };

  const answeredCount = Object.keys(answers).length;
  const skippedCount = skipped.size;
  const unansweredCount = Math.max(0, item.questions.length - answeredCount - skippedCount);

  const graphData = [
    { label: 'Correct', value: result?.correctCount ?? 0, color: COLORS.primary, bg: COLORS.primaryLight },
    { label: 'Incorrect', value: result?.incorrectCount ?? 0, color: COLORS.danger, bg: '#FEE2E2' },
    { label: 'Skipped', value: result?.skippedCount ?? 0, color: COLORS.muted, bg: COLORS.surfaceSoft },
  ];

  const pieSeries = graphData.map((segment) => ({
    value: segment.value,
    color: segment.color,
  }));
  const hasPieData = pieSeries.some((slice) => slice.value > 0);

  if (result) return (
    <View style={{ gap: 16 }}>
      <View style={{ borderRadius: 20, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: result.score >= 50 ? '#93C5FD' : '#FCA5A5', padding: 20, gap: 16 }}>
        <View style={{ alignItems: 'center', gap: 8 }}>
          <View style={{ width: 66, height: 66, borderRadius: 33, borderWidth: 1.5, borderColor: result.score >= 50 ? '#93C5FD' : '#FCA5A5', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={result.score >= 50 ? "trophy-outline" : "close-circle-outline"} size={32} color={result.score >= 50 ? COLORS.primary : COLORS.danger} />
          </View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: result.score >= 50 ? COLORS.primary : COLORS.danger }}>
            {result.score >= 50 ? 'Quiz Passed!' : 'Quiz Attempted'}
          </Text>
          <Text style={{ fontSize: 34, fontWeight: '900', color: result.score >= 50 ? COLORS.primary : COLORS.danger }}>{result.score}%</Text>
        </View>

        {/* Pie chart graph */}
        <View style={{ gap: 8 }}>
          <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>Performance Pie</Text>
          <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 6 }}>
            {hasPieData ? (
              <PieChart
                widthAndHeight={170}
                series={pieSeries}
                cover={{ radius: 0.62, color: COLORS.surface }}
              />
            ) : (
              <View style={{ width: 170, height: 170, borderRadius: 85, borderWidth: 8, borderColor: COLORS.border, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '700' }}>No Attempts</Text>
              </View>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          {graphData.map((segment) => (
            <View key={segment.label} style={{ flex: 1, backgroundColor: 'transparent', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: segment.color + '55' }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: segment.color, textTransform: 'uppercase', letterSpacing: 0.4 }}>{segment.label}</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>{segment.value}</Text>
            </View>
          ))}
        </View>

        {!result.hasDetailedBreakdown && (
          <Text style={{ fontSize: 12, color: COLORS.muted, fontWeight: '600' }}>
            Detailed breakdown is available after your next fresh attempt.
          </Text>
        )}
      </View>
      
      {item.description ? (
        <View style={{ marginTop: 8 }}>
          <Markdown style={mdStyles}>{item.description}</Markdown>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={{ gap: 24 }}>
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 20, fontWeight: '900', color: COLORS.text }}>{item.title}</Text>
        {item.description ? (
          <Markdown style={mdStyles}>{item.description}</Markdown>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={{ flex: 1, backgroundColor: 'transparent', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#93C5FD' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary }}>Answered</Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>{answeredCount}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'transparent', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: '#7DD3FC' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary }}>Skipped</Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>{skippedCount}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: 'transparent', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 10, borderWidth: 1, borderColor: COLORS.border }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.muted }}>Unanswered</Text>
          <Text style={{ fontSize: 18, fontWeight: '900', color: COLORS.text }}>{unansweredCount}</Text>
        </View>
      </View>

      <View style={{ gap: 24 }}>
        {item.questions.map((q, qi) => (
          <View key={qi} style={{ gap: 12, backgroundColor: COLORS.surface, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.text, lineHeight: 24, marginBottom: 4 }}>
              <Text style={{ color: COLORS.primary }}>{qi + 1}.</Text> {q.question}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, fontWeight: '700', color: answers[qi] !== undefined ? COLORS.primary : skipped.has(qi) ? COLORS.primary : COLORS.muted }}>
                {answers[qi] !== undefined ? 'Answered' : skipped.has(qi) ? 'Skipped' : 'Not answered yet'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setAnswers(prev => {
                    const next = { ...prev };
                    delete next[qi];
                    return next;
                  });
                  setSkipped(prev => {
                    const next = new Set(prev);
                    next.add(qi);
                    return next;
                  });
                }}
                style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 99, borderWidth: 1, borderColor: '#BAE6FD', backgroundColor: '#E0F2FE' }}
              >
                <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.primary, textTransform: 'uppercase', letterSpacing: 0.4 }}>Skip</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 8 }}>
              {(q.options || []).map((opt, oi) => {
                const isSelected = answers[qi] === oi;
                return (
                  <TouchableOpacity key={oi} onPress={() => {
                    setAnswers(prev => ({ ...prev, [qi]: oi }));
                    setSkipped(prev => {
                      if (!prev.has(qi)) return prev;
                      const next = new Set(prev);
                      next.delete(qi);
                      return next;
                    });
                  }} activeOpacity={0.8}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1.5,
                      borderColor: isSelected ? COLORS.primary : COLORS.border,
                      backgroundColor: isSelected ? COLORS.primaryLight : COLORS.bg }}>
                    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2,
                      borderColor: isSelected ? COLORS.primary : COLORS.muted,
                      backgroundColor: isSelected ? COLORS.primary : 'transparent',
                      alignItems: 'center', justifyContent: 'center' }}>
                      {isSelected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: isSelected ? '700' : '500', color: isSelected ? COLORS.primaryDark : COLORS.text, flex: 1 }}>{opt}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
      </View>
      
      <View style={{ borderRadius: 16, borderWidth: 1.5, borderColor: highlighted ? COLORS.primary : 'transparent', padding: highlighted ? 6 : 0 }}>
        <TouchableOpacity onPress={submit} disabled={submitting} activeOpacity={0.8}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: 14, paddingVertical: 16, opacity: submitting ? 0.7 : 1, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 }}>
          {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="rocket-outline" size={20} color="#fff" />}
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#fff' }}>{submitting ? 'Submitting…' : 'Submit Quiz (Skip Allowed)'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
