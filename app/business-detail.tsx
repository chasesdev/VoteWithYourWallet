import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Linking, ActivityIndicator, FlatList, Share, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { getBusinessAlignment, fetchBusinessReviews, submitReview, getCurrentUserId } from '../utils/api';
import { Colors, Typography, Spacing, Shadows } from '../constants/design';
import { StyleMixins } from '../utils/styles';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import AlignmentBadge, { AlignmentSpectrum } from '../components/ui/AlignmentBadge';

interface Business {
  id: number;
  name: string;
  description: string;
  category: string;
  website?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  imageUrl?: string;
  phone?: string;
  hours?: string;
  priceRange?: string;
  rating?: number;
  reviewCount?: number;
  alignment: {
    liberal: number;
    conservative: number;
    libertarian: number;
    green: number;
    centrist: number;
  };
  donations?: Array<{
    organization: string;
    amount: number;
    politicalLean: string;
    year: number;
  }>;
  media?: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
    caption?: string;
  }>;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
}

interface UserAlignment {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
}

interface AlignmentScore {
  liberal: number;
  conservative: number;
  libertarian: number;
  green: number;
  centrist: number;
  overallAlignment: number;
}

interface Review {
  id: number;
  userId: number;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  date: string;
  helpful: number;
  alignmentMatch?: number;
  media?: Array<{
    id: string;
    type: 'image' | 'video';
    url: string;
    caption?: string;
  }>;
}

interface PoliticalActivity {
  id: number;
  date: string;
  type: 'donation' | 'statement' | 'endorsement' | 'lobbying' | 'lawsuit';
  title: string;
  description: string;
  amount?: number;
  recipient?: string;
  impact: 'positive' | 'negative' | 'neutral';
  sourceUrl?: string;
}

export default function BusinessDetailScreen() {
  const router = useRouter();
  const localParams = useLocalSearchParams();
  const [business, setBusiness] = useState<Business | null>(null);
  const [userAlignment, setUserAlignment] = useState<UserAlignment>({
    liberal: 0,
    conservative: 0,
    libertarian: 0,
    green: 0,
    centrist: 0,
  });
  const [alignmentScore, setAlignmentScore] = useState<AlignmentScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'alignment' | 'reviews' | 'activity'>('overview');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [politicalActivity, setPoliticalActivity] = useState<PoliticalActivity[]>([]);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState(0);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [userReview, setUserReview] = useState('');
  const [userRating, setUserRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showMediaUploadModal, setShowMediaUploadModal] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [mediaCaption, setMediaCaption] = useState('');

  useEffect(() => {
    const loadBusinessData = async () => {
      try {
        const businessData = localParams.business as string;
        if (businessData) {
          const parsedBusiness = JSON.parse(businessData);
          setBusiness(parsedBusiness);
          
          // Load user alignment from localStorage
          const storedAlignment = localStorage.getItem('userAlignment');
          if (storedAlignment) {
            const alignment = JSON.parse(storedAlignment);
            setUserAlignment(alignment);
            
            // Calculate alignment score if we have both business and user alignment
            if (parsedBusiness && Object.keys(alignment).length > 0) {
              calculateAlignmentScore(parsedBusiness, alignment);
            }
          }
          
          // Load actual reviews from the backend
          const reviewsResponse = await fetchBusinessReviews(parsedBusiness.id);
          if (reviewsResponse.success && reviewsResponse.data) {
            setReviews(reviewsResponse.data as Review[]);
          } else {
            // Fallback to sample data
            loadSampleData(parsedBusiness);
          }
        }
      } catch (error) {
        console.error('Error loading business data:', error);
        setError('Failed to load business data');
      } finally {
        setLoading(false);
      }
    };

    loadBusinessData();
  }, []);

  const loadSampleData = (businessData: Business) => {
    // Sample reviews
    const sampleReviews: Review[] = [
      {
        id: 1,
        userId: 1,
        userName: 'Sarah Johnson',
        rating: 5,
        comment: 'Amazing business that truly aligns with my values! Great products and excellent service.',
        date: '2024-01-15',
        helpful: 12,
        alignmentMatch: 85,
        media: [
          {
            id: '1',
            type: 'image',
            url: 'https://via.placeholder.com/300x200',
            caption: 'Great store interior'
          }
        ]
      },
      {
        id: 2,
        userId: 2,
        userName: 'Mike Chen',
        rating: 4,
        comment: 'Good quality products and the company practices what they preach. Will definitely support again.',
        date: '2024-01-10',
        helpful: 8,
        alignmentMatch: 72,
      },
      {
        id: 3,
        userId: 3,
        userName: 'Emma Davis',
        rating: 3,
        comment: 'Decent products but I wish they were more transparent about their political contributions.',
        date: '2024-01-05',
        helpful: 5,
        alignmentMatch: 45,
      },
    ];
    setReviews(sampleReviews);

    // Sample political activity
    const sampleActivity: PoliticalActivity[] = [
      {
        id: 1,
        date: '2023-12-01',
        type: 'donation',
        title: 'Political Campaign Contribution',
        description: 'Donated to progressive political campaign focused on environmental protection',
        amount: 50000,
        recipient: 'Green Future PAC',
        impact: 'positive',
        sourceUrl: 'https://example.com/source1',
      },
      {
        id: 2,
        date: '2023-10-15',
        type: 'statement',
        title: 'Public Policy Statement',
        description: 'Released official statement supporting climate change legislation',
        impact: 'positive',
        sourceUrl: 'https://example.com/source2',
      },
      {
        id: 3,
        date: '2023-08-20',
        type: 'endorsement',
        title: 'Political Endorsement',
        description: 'Endorsed candidates who support sustainable business practices',
        impact: 'positive',
        sourceUrl: 'https://example.com/source3',
      },
      {
        id: 4,
        date: '2023-06-10',
        type: 'lobbying',
        title: 'Lobbying Activity',
        description: 'Lobbied for renewable energy tax credits',
        amount: 25000,
        impact: 'positive',
        sourceUrl: 'https://example.com/source4',
      },
    ];
    setPoliticalActivity(sampleActivity);
  };

  const calculateAlignmentScore = async (businessData: Business, alignment: UserAlignment) => {
    try {
      // Generate a simple user ID (in a real app, this would come from authentication)
      const userId = Math.floor(Math.random() * 1000000);
      
      const response = await getBusinessAlignment(userId, businessData.id);
      
      if (response.success && response.data) {
        setAlignmentScore(response.data as AlignmentScore);
      } else {
        // Fallback to local calculation
        const localScore = calculateLocalAlignmentScore(businessData, alignment);
        setAlignmentScore(localScore);
      }
    } catch (error) {
      console.error('Error fetching alignment score:', error);
      // Fallback to local calculation
      const localScore = calculateLocalAlignmentScore(businessData, alignment);
      setAlignmentScore(localScore);
    }
  };

  const calculateLocalAlignmentScore = (businessData: Business, alignment: UserAlignment): AlignmentScore => {
    let totalAlignment = 0;
    let totalWeight = 0;
    
    const alignmentScores = {
      liberal: calculateIndividualAlignment(alignment.liberal, businessData.alignment.liberal),
      conservative: calculateIndividualAlignment(alignment.conservative, businessData.alignment.conservative),
      libertarian: calculateIndividualAlignment(alignment.libertarian, businessData.alignment.libertarian),
      green: calculateIndividualAlignment(alignment.green, businessData.alignment.green),
      centrist: calculateIndividualAlignment(alignment.centrist, businessData.alignment.centrist),
    };
    
    Object.keys(alignmentScores).forEach(key => {
      const weight = alignment[key as keyof typeof alignment] || 0;
      totalAlignment += alignmentScores[key as keyof typeof alignmentScores] * weight;
      totalWeight += weight;
    });
    
    const overallAlignment = totalWeight > 0 ? totalAlignment / totalWeight : 0;
    
    return {
      ...alignmentScores,
      overallAlignment: Math.round(overallAlignment * 100),
    };
  };

  const calculateIndividualAlignment = (userValue: number, businessValue: number): number => {
    if (userValue === 0) return 0; // User doesn't care about this alignment
    
    // Normalize both values to 0-1 range
    const normalizedUser = Math.min(userValue, 100) / 100;
    const normalizedBusiness = Math.min(businessValue, 100) / 100;
    
    // Calculate the absolute difference
    const difference = Math.abs(normalizedUser - normalizedBusiness);
    
    // Return a score that is 1 when they match exactly and 0 when they are opposite
    return 1 - difference;
  };

  const getAlignmentColor = (percentage: number): string => {
    if (percentage >= 75) return Colors.success[500];
    if (percentage >= 50) return Colors.accent[500];
    if (percentage >= 25) return Colors.warning[500];
    return Colors.error[500];
  };

  const getAlignmentLabel = (percentage: number): string => {
    if (percentage >= 75) return 'High Alignment';
    if (percentage >= 50) return 'Medium Alignment';
    if (percentage >= 25) return 'Low Alignment';
    return 'Very Low Alignment';
  };

  const openWebsite = () => {
    if (business?.website) {
      Linking.openURL(business.website);
    }
  };

  const openMaps = () => {
    if (business?.latitude && business?.longitude) {
      const url = `https://www.google.com/maps/search/?api=1&query=${business.latitude},${business.longitude}`;
      Linking.openURL(url);
    }
  };

  const callBusiness = () => {
    if (business?.phone) {
      Linking.openURL(`tel:${business.phone}`);
    }
  };

  const shareBusiness = async () => {
    if (business) {
      try {
        await Share.share({
          message: `Check out ${business.name} - ${business.description}`,
          url: business.website,
          title: business.name,
        });
      } catch (error) {
        console.error('Error sharing business:', error);
      }
    }
  };

  const handleSubmitReview = async () => {
    if (userRating === 0) {
      Alert.alert('Rating Required', 'Please select a rating before submitting your review.');
      return;
    }

    if (!userReview.trim()) {
      Alert.alert('Review Required', 'Please write a review before submitting.');
      return;
    }

    try {
      const userId = getCurrentUserId();
      if (!business) {
        Alert.alert('Error', 'Business data not available');
        return;
      }
      
      const response = await submitReview(
        business.id,
        userId,
        userRating,
        userReview,
        [], // Media would be uploaded separately
        userAlignment
      );

      if (response.success) {
        // Refresh reviews
        const reviewsResponse = await fetchBusinessReviews(business.id);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data as Review[]);
        }

        setUserReview('');
        setUserRating(0);
        setShowReviewModal(false);
        Alert.alert('Success', 'Your review has been submitted!');
      } else {
        Alert.alert('Error', response.error || 'Failed to submit review');
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Alert.alert('Error', 'Failed to submit review');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        await uploadMedia(result.assets[0].uri, 'image');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        await uploadMedia(result.assets[0].uri, 'image');
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'video/*'],
        copyToCacheDirectory: true,
      });

      if (result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const mediaType = asset.mimeType?.startsWith('image/') ? 'image' : 'video';
        await uploadMedia(asset.uri, mediaType);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadMedia = async (uri: string, type: 'image' | 'video') => {
    setUploadingMedia(true);
    
    try {
      // Simulate upload process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create a new media item
      const newMedia = {
        id: Date.now().toString(),
        type,
        url: uri,
        caption: mediaCaption || undefined,
      };

      // Add to business media
      if (business) {
        const updatedBusiness = {
          ...business,
          media: [...(business.media || []), newMedia]
        };
        setBusiness(updatedBusiness);
      }

      setMediaCaption('');
      setShowMediaUploadModal(false);
      Alert.alert('Success', 'Media uploaded successfully!');
    } catch (error) {
      console.error('Error uploading media:', error);
      Alert.alert('Error', 'Failed to upload media');
    } finally {
      setUploadingMedia(false);
    }
  };

  const renderMediaGallery = () => {
    if (!business?.media || business.media.length === 0) return null;

    return (
      <View style={styles.mediaGallery}>
        <View style={styles.mediaGalleryHeader}>
          <Text style={styles.sectionTitle}>Media Gallery</Text>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setShowMediaUploadModal(true)}
          >
            <Ionicons name="add" size={16} color={Colors.primary[600]} />
            <Text style={styles.addMediaText}>Add Media</Text>
          </Button>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {business.media.map((media, index) => (
            <TouchableOpacity
              key={media.id}
              style={styles.mediaItem}
              onPress={() => {
                setSelectedMediaIndex(index);
                setShowMediaModal(true);
              }}
            >
              <Image
                source={{ uri: media.url }}
                style={styles.mediaThumbnail}
                resizeMode="cover"
              />
              {media.type === 'video' && (
                <View style={styles.videoOverlay}>
                  <Ionicons name="play-circle" size={32} color={Colors.white} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const renderMediaUploadModal = () => (
    <Modal
      visible={showMediaUploadModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowMediaUploadModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Upload Media</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowMediaUploadModal(false)}
          >
            <Ionicons name="close" size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          {uploadingMedia ? (
            <View style={styles.uploadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[600]} />
              <Text style={styles.uploadingText}>Uploading media...</Text>
            </View>
          ) : (
            <>
              <View style={styles.uploadOptions}>
                <TouchableOpacity style={styles.uploadOption} onPress={pickImage}>
                  <Ionicons name="image" size={32} color={Colors.primary[600]} />
                  <Text style={styles.uploadOptionText}>Choose from Library</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.uploadOption} onPress={takePhoto}>
                  <Ionicons name="camera" size={32} color={Colors.primary[600]} />
                  <Text style={styles.uploadOptionText}>Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.uploadOption} onPress={pickDocument}>
                  <Ionicons name="document" size={32} color={Colors.primary[600]} />
                  <Text style={styles.uploadOptionText}>Choose Document</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.captionInput}>
                <Text style={styles.captionLabel}>Caption (Optional)</Text>
                <TextInput
                  style={styles.captionTextInput}
                  value={mediaCaption}
                  onChangeText={setMediaCaption}
                  placeholder="Add a caption to your media..."
                  multiline
                />
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );

  const renderBusinessInfo = () => (
    <Card style={styles.businessInfoCard}>
      <View style={styles.businessInfoGrid}>
        {business?.phone && (
          <TouchableOpacity style={styles.infoItem} onPress={callBusiness}>
            <View style={styles.infoIcon}>
              <Ionicons name="call" size={20} color={Colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Phone</Text>
              <Text style={styles.infoValue}>{business.phone}</Text>
            </View>
          </TouchableOpacity>
        )}
        
        {business?.hours && (
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="time" size={20} color={Colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Hours</Text>
              <Text style={styles.infoValue}>{business.hours}</Text>
            </View>
          </View>
        )}
        
        {business?.priceRange && (
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="pricetag" size={20} color={Colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Price Range</Text>
              <Text style={styles.infoValue}>{business.priceRange}</Text>
            </View>
          </View>
        )}
        
        {business?.rating && (
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Ionicons name="star" size={20} color={Colors.primary[600]} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Rating</Text>
              <View style={styles.ratingContainer}>
                <Text style={styles.infoValue}>{business.rating.toFixed(1)}</Text>
                <Ionicons name="star" size={14} color={Colors.accent[500]} />
                <Text style={styles.reviewCountText}>({business.reviewCount} reviews)</Text>
              </View>
            </View>
          </View>
        )}
      </View>
    </Card>
  );

  const renderSocialMedia = () => {
    if (!business?.socialMedia) return null;

    return (
      <Card style={styles.socialMediaCard}>
        <Text style={styles.sectionTitle}>Connect</Text>
        <View style={styles.socialMediaGrid}>
          {business.socialMedia.twitter && (
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-twitter" size={24} color="#1DA1F2" />
            </TouchableOpacity>
          )}
          {business.socialMedia.facebook && (
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-facebook" size={24} color="#4267B2" />
            </TouchableOpacity>
          )}
          {business.socialMedia.instagram && (
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-instagram" size={24} color="#E4405F" />
            </TouchableOpacity>
          )}
          {business.socialMedia.linkedin && (
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-linkedin" size={24} color="#0077B5" />
            </TouchableOpacity>
          )}
        </View>
      </Card>
    );
  };

  const renderInteractiveAlignment = () => {
    if (!business || !alignmentScore) return null;

    return (
      <Card style={styles.alignmentCard}>
        <Text style={styles.sectionTitle}>Political Alignment Analysis</Text>
        
        <View style={styles.overallAlignmentContainer}>
          <Text style={styles.overallAlignmentLabel}>Overall Match with Your Values</Text>
          <AlignmentBadge
            percentage={alignmentScore.overallAlignment}
            size="lg"
            variant="match"
          />
          <Text style={styles.overallAlignmentScoreText}>
            {getAlignmentLabel(alignmentScore.overallAlignment)}
          </Text>
        </View>

        <View style={styles.alignmentBreakdown}>
          <Text style={styles.breakdownTitle}>Detailed Breakdown</Text>
          <AlignmentSpectrum
            alignments={business.alignment}
            userAlignments={userAlignment}
            compact={false}
          />
        </View>

        <View style={styles.alignmentInsights}>
          <Text style={styles.insightsTitle}>Key Insights</Text>
          <View style={styles.insightItem}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success[500]} />
            <Text style={styles.insightText}>
              Strongest match: {getStrongestAlignment(alignmentScore)}
            </Text>
          </View>
          <View style={styles.insightItem}>
            <Ionicons name="information-circle" size={16} color={Colors.primary[500]} />
            <Text style={styles.insightText}>
              {getAlignmentInsight(alignmentScore)}
            </Text>
          </View>
        </View>
      </Card>
    );
  };

  const getStrongestAlignment = (score: AlignmentScore): string => {
    const { liberal, conservative, libertarian, green, centrist } = score;
    const max = Math.max(liberal, conservative, libertarian, green, centrist);
    
    if (max === liberal) return 'Liberal values';
    if (max === conservative) return 'Conservative values';
    if (max === libertarian) return 'Libertarian values';
    if (max === green) return 'Green values';
    return 'Centrist values';
  };

  const getAlignmentInsight = (score: AlignmentScore): string => {
    const overall = score.overallAlignment;
    if (overall >= 75) return 'Excellent alignment with your political values!';
    if (overall >= 50) return 'Good alignment with some room for improvement.';
    if (overall >= 25) return 'Moderate alignment - consider your priorities.';
    return 'Low alignment - this business may not match your values.';
  };

  const renderReviews = () => (
    <View style={styles.reviewsSection}>
      <View style={styles.reviewsHeader}>
        <Text style={styles.sectionTitle}>Customer Reviews</Text>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => setShowReviewModal(true)}
        >
          Write Review
        </Button>
      </View>

      <FlatList
        data={reviews}
        renderItem={({ item }) => (
          <Card style={styles.reviewCard}>
            <View style={styles.reviewHeader}>
              <View style={styles.reviewAuthor}>
                <View style={styles.reviewAvatar}>
                  <Ionicons name="person" size={16} color={Colors.gray[500]} />
                </View>
                <View>
                  <Text style={styles.reviewAuthorName}>{item.userName}</Text>
                  <Text style={styles.reviewDate}>{item.date}</Text>
                </View>
              </View>
              <View style={styles.reviewRating}>
                <View style={styles.stars}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Ionicons
                      key={star}
                      name={star <= item.rating ? "star" : "star-outline"}
                      size={14}
                      color={Colors.accent[500]}
                    />
                  ))}
                </View>
                {item.alignmentMatch && (
                  <Badge variant="primary" size="sm">
                    {item.alignmentMatch}% match
                  </Badge>
                )}
              </View>
            </View>
            <Text style={styles.reviewComment}>{item.comment}</Text>
            
            {/* Review Media */}
            {item.media && item.media.length > 0 && (
              <View style={styles.reviewMedia}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {item.media.map((media) => (
                    <TouchableOpacity key={media.id} style={styles.reviewMediaItem}>
                      <Image
                        source={{ uri: media.url }}
                        style={styles.reviewMediaThumbnail}
                        resizeMode="cover"
                      />
                      {media.type === 'video' && (
                        <View style={styles.reviewVideoOverlay}>
                          <Ionicons name="play" size={16} color={Colors.white} />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
            
            <View style={styles.reviewActions}>
              <TouchableOpacity style={styles.helpfulButton}>
                <Ionicons name="thumbs-up" size={14} color={Colors.gray[500]} />
                <Text style={styles.helpfulText}>Helpful ({item.helpful})</Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const renderPoliticalActivity = () => (
    <View style={styles.activitySection}>
      <Text style={styles.sectionTitle}>Political Activity Timeline</Text>
      <FlatList
        data={politicalActivity}
        renderItem={({ item }) => (
          <Card style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <View style={styles.activityType}>
                <Ionicons
                  name={getActivityIcon(item.type)}
                  size={20}
                  color={getActivityColor(item.impact)}
                />
                <Text style={styles.activityTypeText}>{item.type}</Text>
              </View>
              <Text style={styles.activityDate}>{item.date}</Text>
            </View>
            <Text style={styles.activityTitle}>{item.title}</Text>
            <Text style={styles.activityDescription}>{item.description}</Text>
            {item.amount && (
              <Text style={styles.activityAmount}>Amount: ${item.amount.toLocaleString()}</Text>
            )}
            {item.recipient && (
              <Text style={styles.activityRecipient}>Recipient: {item.recipient}</Text>
            )}
            {item.sourceUrl && (
              <TouchableOpacity style={styles.sourceLink}>
                <Text style={styles.sourceText}>View Source</Text>
                <Ionicons name="open-outline" size={14} color={Colors.primary[600]} />
              </TouchableOpacity>
            )}
          </Card>
        )}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );

  const getActivityIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'donation': return 'cash';
      case 'statement': return 'document-text';
      case 'endorsement': return 'hand-left';
      case 'lobbying': return 'people';
      case 'lawsuit': return 'document';
      default: return 'information-circle';
    }
  };

  const getActivityColor = (impact: string): string => {
    switch (impact) {
      case 'positive': return Colors.success[500];
      case 'negative': return Colors.error[500];
      default: return Colors.gray[500];
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.tabContent}>
            {renderBusinessInfo()}
            {renderMediaGallery()}
            {renderSocialMedia()}
          </View>
        );
      case 'alignment':
        return (
          <View style={styles.tabContent}>
            {renderInteractiveAlignment()}
          </View>
        );
      case 'reviews':
        return renderReviews();
      case 'activity':
        return renderPoliticalActivity();
      default:
        return null;
    }
  };

  const renderReviewModal = () => (
    <Modal
      visible={showReviewModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowReviewModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Write a Review</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowReviewModal(false)}
          >
            <Ionicons name="close" size={24} color={Colors.gray[600]} />
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          <View style={styles.ratingInput}>
            <Text style={styles.ratingLabel}>Your Rating</Text>
            <View style={styles.starsInput}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setUserRating(star)}
                >
                  <Ionicons
                    name={star <= userRating ? "star" : "star-outline"}
                    size={32}
                    color={Colors.accent[500]}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.reviewInput}>
            <Text style={styles.reviewInputLabel}>Your Review</Text>
            <TextInput
              style={styles.reviewTextInput}
              value={userReview}
              onChangeText={setUserReview}
              placeholder="Share your experience with this business..."
              multiline
              numberOfLines={4}
            />
          </View>

          <Button
            variant="primary"
            size="lg"
            onPress={handleSubmitReview}
            style={styles.submitButton}
          >
            Submit Review
          </Button>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary[600]} />
        <Text style={styles.loadingText}>Loading business details...</Text>
      </View>
    );
  }

  if (error || !business) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color={Colors.error[500]} />
        <Text style={styles.errorText}>{error || 'Business not found'}</Text>
        <Button
          variant="primary"
          onPress={() => router.back()}
          style={styles.retryButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Image */}
      <Image 
        source={{ uri: business.imageUrl || 'https://via.placeholder.com/400x200' }} 
        style={styles.businessImage} 
      />

      {/* Content */}
      <ScrollView style={styles.scrollViewContent}>
        {/* Business Header */}
        <View style={styles.businessHeader}>
          <View style={styles.businessTitleRow}>
            <View style={styles.businessTitle}>
              <Text style={styles.businessName}>{business.name}</Text>
              <View style={styles.businessMeta}>
                <Badge variant="primary" size="sm">
                  {business.category}
                </Badge>
                {business.rating && (
                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={12} color={Colors.accent[500]} />
                    <Text style={styles.ratingBadgeText}>{business.rating.toFixed(1)}</Text>
                  </View>
                )}
              </View>
            </View>
            <TouchableOpacity style={styles.shareButton} onPress={shareBusiness}>
              <Ionicons name="share-outline" size={20} color={Colors.gray[600]} />
            </TouchableOpacity>
          </View>
          <Text style={styles.businessDescription}>{business.description}</Text>
        </View>

        {/* Tabs */}
        <View style={styles.tabContainer}>
          {(['overview', 'alignment', 'reviews', 'activity'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab && styles.activeTabText
              ]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {renderTabContent()}

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            variant="primary"
            size="lg"
            onPress={openWebsite}
            disabled={!business.website}
            style={styles.actionButton}
          >
            Visit Website
          </Button>
          <Button
            variant="primary"
            size="lg"
            onPress={openMaps}
            disabled={!business.latitude || !business.longitude}
            style={styles.actionButton}
          >
            Get Directions
          </Button>
        </View>
      </ScrollView>

      {/* Review Modal */}
      {renderReviewModal()}
      
      {/* Media Upload Modal */}
      {renderMediaUploadModal()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.gray[50],
  },
  businessImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  scrollViewContent: {
    flex: 1,
  },
  businessHeader: {
    padding: Spacing[5],
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  businessTitleRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start' as const,
    marginBottom: Spacing[3],
  },
  businessTitle: {
    flex: 1,
  },
  businessName: {
    ...StyleMixins.heading3,
    color: Colors.gray[900],
    marginBottom: Spacing[2],
  },
  businessMeta: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing[2],
  },
  ratingBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: Colors.accent[50],
    paddingHorizontal: Spacing[2],
    paddingVertical: Spacing[1],
    borderRadius: 12,
  },
  ratingBadgeText: {
    ...StyleMixins.caption,
    color: Colors.accent[700],
    fontWeight: '600' as const,
    marginLeft: Spacing[1],
  },
  shareButton: {
    padding: Spacing[2],
  },
  businessDescription: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    lineHeight: 24,
  },
  tabContainer: {
    flexDirection: 'row' as const,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing[4],
    alignItems: 'center' as const,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary[600],
  },
  tabText: {
    ...StyleMixins.bodySmall,
    color: Colors.gray[600],
    fontWeight: '500' as const,
  },
  activeTabText: {
    color: Colors.primary[600],
    fontWeight: '600' as const,
  },
  tabContent: {
    padding: Spacing[4],
  },
  sectionTitle: {
    ...StyleMixins.heading4,
    color: Colors.gray[900],
    marginBottom: Spacing[3],
  },
  businessInfoCard: {
    marginBottom: Spacing[4],
  },
  businessInfoGrid: {
    gap: Spacing[4],
  },
  infoItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: Spacing[3],
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
    ...StyleMixins.flexCenter,
    marginRight: Spacing[3],
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    ...StyleMixins.caption,
    color: Colors.gray[600],
    marginBottom: Spacing[1],
  },
  infoValue: {
    ...StyleMixins.body,
    color: Colors.gray[900],
    fontWeight: '500' as const,
  },
  ratingContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: Spacing[1],
  },
  reviewCountText: {
    ...StyleMixins.caption,
    color: Colors.gray[600],
  },
  mediaGallery: {
    marginBottom: Spacing[4],
  },
  mediaGalleryHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    marginBottom: Spacing[3],
  },
  addMediaText: {
    ...StyleMixins.caption,
    color: Colors.primary[600],
    marginLeft: Spacing[1],
  },
  mediaItem: {
    marginRight: Spacing[3],
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  mediaThumbnail: {
    width: 120,
    height: 80,
    borderRadius: 8,
  },
  videoOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    ...StyleMixins.flexCenter,
  },
  socialMediaCard: {
    marginBottom: Spacing[4],
  },
  socialMediaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: Spacing[2],
  },
  socialButton: {
    padding: Spacing[3],
  },
  alignmentCard: {
    marginBottom: Spacing[4],
  },
  overallAlignmentContainer: {
    alignItems: 'center' as const,
    marginBottom: Spacing[5],
  },
  overallAlignmentLabel: {
    ...StyleMixins.body,
    color: Colors.gray[700],
    marginBottom: Spacing[3],
    textAlign: 'center',
  },
  overallAlignmentScoreText: {
    ...StyleMixins.bodySmall,
    color: Colors.gray[600],
    marginTop: Spacing[2],
    textAlign: 'center',
  },
  alignmentBreakdown: {
    marginBottom: Spacing[5],
  },
  breakdownTitle: {
    ...StyleMixins.body,
    color: Colors.gray[700],
    marginBottom: Spacing[3],
  },
  alignmentInsights: {
    marginBottom: Spacing[3],
  },
  insightsTitle: {
    ...StyleMixins.body,
    color: Colors.gray[700],
    marginBottom: Spacing[3],
  },
  insightItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: Spacing[2],
  },
  insightText: {
    ...StyleMixins.bodySmall,
    color: Colors.gray[600],
    marginLeft: Spacing[2],
  },
  reviewsSection: {
    marginBottom: Spacing[4],
  },
  reviewsHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    marginBottom: Spacing[3],
  },
  reviewCard: {
    marginBottom: Spacing[3],
  },
  reviewHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'flex-start' as const,
    marginBottom: Spacing[3],
  },
  reviewAuthor: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  reviewAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.gray[100],
    ...StyleMixins.flexCenter,
    marginRight: Spacing[2],
  },
  reviewAuthorName: {
    ...StyleMixins.body,
    fontWeight: '500' as const,
    color: Colors.gray[900],
  },
  reviewDate: {
    ...StyleMixins.caption,
    color: Colors.gray[500],
  },
  reviewRating: {
    alignItems: 'flex-end' as const,
    gap: Spacing[2],
  },
  stars: {
    flexDirection: 'row' as const,
  },
  reviewComment: {
    ...StyleMixins.body,
    color: Colors.gray[700],
    lineHeight: 22,
    marginBottom: Spacing[3],
  },
  reviewMedia: {
    marginBottom: Spacing[3],
  },
  reviewMediaItem: {
    marginRight: Spacing[2],
    borderRadius: 8,
    overflow: 'hidden' as const,
  },
  reviewMediaThumbnail: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  reviewVideoOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    ...StyleMixins.flexCenter,
  },
  reviewActions: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-end' as const,
  },
  helpfulButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: Spacing[2],
  },
  helpfulText: {
    ...StyleMixins.caption,
    color: Colors.gray[500],
    marginLeft: Spacing[1],
  },
  activitySection: {
    marginBottom: Spacing[4],
  },
  activityCard: {
    marginBottom: Spacing[3],
  },
  activityHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center' as const,
    marginBottom: Spacing[3],
  },
  activityType: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  activityTypeText: {
    ...StyleMixins.caption,
    color: Colors.gray[600],
    marginLeft: Spacing[1],
    textTransform: 'uppercase' as const,
  },
  activityDate: {
    ...StyleMixins.caption,
    color: Colors.gray[500],
  },
  activityTitle: {
    ...StyleMixins.body,
    fontWeight: '600' as const,
    color: Colors.gray[900],
    marginBottom: Spacing[2],
  },
  activityDescription: {
    ...StyleMixins.body,
    color: Colors.gray[700],
    lineHeight: 22,
    marginBottom: Spacing[2],
  },
  activityAmount: {
    ...StyleMixins.bodySmall,
    color: Colors.gray[600],
    marginBottom: Spacing[1],
  },
  activityRecipient: {
    ...StyleMixins.bodySmall,
    color: Colors.gray[600],
    marginBottom: Spacing[2],
  },
  sourceLink: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
  },
  sourceText: {
    ...StyleMixins.bodySmall,
    color: Colors.primary[600],
    marginRight: Spacing[1],
  },
  actionButtons: {
    flexDirection: 'row' as const,
    gap: Spacing[3],
    padding: Spacing[4],
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.gray[200],
  },
  actionButton: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    ...StyleMixins.flexCenter,
    backgroundColor: Colors.white,
  },
  loadingText: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    marginTop: Spacing[5],
  },
  errorContainer: {
    flex: 1,
    ...StyleMixins.flexCenter,
    padding: Spacing[5],
    backgroundColor: Colors.white,
  },
  errorText: {
    ...StyleMixins.heading4,
    color: Colors.error[600],
    textAlign: 'center',
    marginTop: Spacing[4],
  },
  retryButton: {
    marginTop: Spacing[4],
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray[200],
  },
  modalTitle: {
    ...StyleMixins.heading3,
    color: Colors.gray[900],
  },
  closeButton: {
    padding: Spacing[2],
  },
  modalContent: {
    flex: 1,
    padding: Spacing[4],
  },
  ratingInput: {
    marginBottom: Spacing[5],
  },
  ratingLabel: {
    ...StyleMixins.body,
    color: Colors.gray[700],
    marginBottom: Spacing[3],
  },
  starsInput: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: Spacing[2],
  },
  reviewInput: {
    marginBottom: Spacing[5],
  },
  reviewInputLabel: {
    ...StyleMixins.body,
    color: Colors.gray[700],
    marginBottom: Spacing[3],
  },
  reviewTextInput: {
    ...StyleMixins.body,
    color: Colors.gray[900],
    padding: Spacing[3],
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginBottom: Spacing[4],
  },
  uploadOptions: {
    marginBottom: Spacing[5],
  },
  uploadOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: Spacing[4],
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    marginBottom: Spacing[3],
  },
  uploadOptionText: {
    ...StyleMixins.body,
    color: Colors.gray[900],
    marginLeft: Spacing[3],
  },
  captionInput: {
    marginBottom: Spacing[5],
  },
  captionLabel: {
    ...StyleMixins.body,
    color: Colors.gray[700],
    marginBottom: Spacing[3],
  },
  captionTextInput: {
    ...StyleMixins.body,
    color: Colors.gray[900],
    padding: Spacing[3],
    backgroundColor: Colors.gray[50],
    borderRadius: 8,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  uploadingContainer: {
    ...StyleMixins.flexCenter,
    padding: Spacing[8],
  },
  uploadingText: {
    ...StyleMixins.body,
    color: Colors.gray[600],
    marginTop: Spacing[3],
  },
});