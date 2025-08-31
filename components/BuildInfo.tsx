import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors, Typography } from '../constants/design';
import buildInfo from '../build.json';

interface BuildInfoProps {
  style?: any;
  showDetails?: boolean;
}

export default function BuildInfo({ style, showDetails = false }: BuildInfoProps) {
  const [expanded, setExpanded] = React.useState(false);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handlePress = () => {
    if (showDetails) {
      setExpanded(!expanded);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={handlePress}
      disabled={!showDetails}
      activeOpacity={showDetails ? 0.7 : 1}
    >
      <Text style={styles.buildText}>
        Build {buildInfo.buildNumber}
      </Text>
      
      {showDetails && expanded && (
        <View style={styles.details}>
          <Text style={styles.detailText}>
            Version: {buildInfo.version}
          </Text>
          <Text style={styles.detailText}>
            Built: {formatDate(buildInfo.lastBuild)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = {
  container: {
    alignItems: 'center' as const,
    padding: 8,
  },
  buildText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[400],
    fontFamily: Typography.fontFamily.mono || 'monospace',
    letterSpacing: 0.5,
  },
  details: {
    alignItems: 'center' as const,
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  detailText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.gray[400],
    fontFamily: Typography.fontFamily.mono || 'monospace',
    textAlign: 'center' as const,
    lineHeight: 16,
  },
};