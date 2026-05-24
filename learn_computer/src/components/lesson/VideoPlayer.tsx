import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import { useRef, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';
import Markdown from 'react-native-markdown-display';
import { API_BASE_URL, COLORS } from '../../lib/constants';
import { mdStyles } from './MarkdownStyles';
import { VideoData } from './types';

// Extract YouTube ID from various YouTube URL formats
function extractYouTubeID(url: string) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : false;
}

export function VideoSection({ item, onWatched, watched, highlighted }: { item: VideoData; onWatched: () => void; watched: boolean; highlighted?: boolean }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<Video>(null);

  const url = item.externalVideoUrl || item.videoFilePath;
  const isYouTube = url && extractYouTubeID(url);
  const fullVideoUrl = url?.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  // Automatically mark as watched when video completes
  const handlePlaybackStatusUpdate = (status: any) => {
    if (status.didJustFinish) {
      if (!watched) onWatched();
    }
  };

  return (
    <View style={{ gap: 16 }}>
      {/* Video Player Container */}
      <View style={{ borderRadius: 16, backgroundColor: '#0F172A', overflow: 'hidden', borderWidth: 1.5, borderColor: highlighted ? COLORS.primary : COLORS.border }}>
        {!url ? (
          <View style={{ height: 220, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <Ionicons name="videocam-off-outline" size={40} color={COLORS.muted} />
            <Text style={{ color: COLORS.muted, fontSize: 14 }}>No video URL attached</Text>
          </View>
        ) : isYouTube ? (
          <View style={{ height: 240, width: '100%' }}>
            <WebView
              style={{ flex: 1, backgroundColor: '#0F172A' }}
              javaScriptEnabled={true}
              allowsInlineMediaPlayback={true}
              bounces={false}
              scrollEnabled={false}
              originWhitelist={['*']}
              source={{
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                      <style>
                        body { margin: 0; padding: 0; background-color: #0F172A; overflow: hidden; display: flex; align-items: center; justify-content: center; height: 100vh; }
                        iframe { width: 100%; height: 100%; border: none; }
                      </style>
                    </head>
                    <body>
                      <iframe src="https://www.youtube.com/embed/${extractYouTubeID(url)}?playsinline=1&modestbranding=1&rel=0" frameborder="0" allow="autoplay; fullscreen" allowfullscreen></iframe>
                    </body>
                  </html>
                `
              }}
            />
            {/* Overlay to trigger watched state manually since iframe can't easily bubble completion events */}
            {!watched && (
              <TouchableOpacity
                onPress={onWatched}
                style={{ position: 'absolute', bottom: 12, right: 12, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Ionicons name="checkmark" size={16} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Mark as Watched</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={{ height: 240, width: '100%' }}>
            <Video
              ref={videoRef}
              style={{ flex: 1 }}
              source={{ uri: fullVideoUrl }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
              onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            />
          </View>
        )}
      </View>

      {/* Description */}
      <View style={{ gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text }}>{item.title}</Text>
        {item.description ? (
          <View style={{ marginTop: 8 }}>
            <Markdown style={mdStyles}>{item.description}</Markdown>
          </View>
        ) : null}
      </View>
    </View>
  );
}
