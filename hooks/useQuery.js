/**
 * GraphQL Sorgu Hook'u
 * 
 * Bu hook, Apollo Client'ın useQuery hook'unu saran ve ek özellikler ekleyen
 * bir yardımcı fonksiyondur. Hata işleme, yükleme durumu ve veri dönüşümü gibi
 * yaygın işlemleri kolaylaştırır.
 */

import { useQuery as useApolloQuery } from '@apollo/client';
import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

/**
 * GraphQL sorguları için özelleştirilmiş hook
 * 
 * @param {Object} query - GraphQL sorgu belgesi
 * @param {Object} options - Sorgu seçenekleri
 * @param {Object} options.variables - Sorgu değişkenleri
 * @param {Function} options.onCompleted - Sorgu tamamlandığında çağrılacak fonksiyon
 * @param {Function} options.onError - Hata oluştuğunda çağrılacak fonksiyon
 * @param {boolean} options.showErrorToast - Hata toast mesajı gösterilsin mi
 * @param {Function} options.transform - Veriyi dönüştürmek için fonksiyon
 * @param {boolean} options.skip - Sorguyu atla
 * @param {string} options.fetchPolicy - Veri çekme politikası
 * @returns {Object} Sorgu sonucu ve yardımcı fonksiyonlar
 */
export function useQuery(query, options = {}) {
  const {
    variables,
    onCompleted,
    onError,
    showErrorToast = true,
    transform,
    skip = false,
    fetchPolicy = 'cache-and-network',
    ...restOptions
  } = options;
  
  // Dönüştürülmüş veriyi saklamak için state
  const [transformedData, setTransformedData] = useState(null);
  
  // Apollo Client'ın useQuery hook'unu kullan
  const result = useApolloQuery(query, {
    variables,
    skip,
    fetchPolicy,
    onCompleted: (data) => {
      // Veriyi dönüştür
      if (transform && data) {
        const transformed = transform(data);
        setTransformedData(transformed);
      }
      
      // Tamamlanma callback'ini çağır
      if (onCompleted) {
        onCompleted(data);
      }
    },
    onError: (error) => {
      // Hata mesajını göster
      if (showErrorToast) {
        toast.error(error.message || 'Bir hata oluştu');
      }
      
      // Hata callback'ini çağır
      if (onError) {
        onError(error);
      }
    },
    ...restOptions,
  });
  
  // Veri değiştiğinde dönüştürülmüş veriyi güncelle
  useEffect(() => {
    if (transform && result.data) {
      const transformed = transform(result.data);
      setTransformedData(transformed);
    }
  }, [result.data, transform]);
  
  // Yeniden çekme fonksiyonu
  const refetch = async (newVariables) => {
    try {
      const { data } = await result.refetch(newVariables);
      
      // Veriyi dönüştür
      if (transform && data) {
        const transformed = transform(data);
        setTransformedData(transformed);
      }
      
      return { data };
    } catch (error) {
      // Hata mesajını göster
      if (showErrorToast) {
        toast.error(error.message || 'Veri yeniden çekilirken bir hata oluştu');
      }
      
      return { error };
    }
  };
  
  // Daha fazla veri çekme fonksiyonu (sayfalama için)
  const fetchMore = async (fetchMoreOptions) => {
    try {
      const { data } = await result.fetchMore(fetchMoreOptions);
      
      // Veriyi dönüştür
      if (transform && data) {
        const transformed = transform(data);
        setTransformedData(transformed);
      }
      
      return { data };
    } catch (error) {
      // Hata mesajını göster
      if (showErrorToast) {
        toast.error(error.message || 'Daha fazla veri çekilirken bir hata oluştu');
      }
      
      return { error };
    }
  };
  
  return {
    ...result,
    data: transform ? transformedData : result.data,
    refetch,
    fetchMore,
  };
}

export default useQuery; 