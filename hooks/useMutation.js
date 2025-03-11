/**
 * GraphQL Mutasyon Hook'u
 * 
 * Bu hook, Apollo Client'ın useMutation hook'unu saran ve ek özellikler ekleyen
 * bir yardımcı fonksiyondur. Hata işleme, yükleme durumu ve başarı bildirimleri gibi
 * yaygın işlemleri kolaylaştırır.
 */

import { useMutation as useApolloMutation } from '@apollo/client';
import { useState } from 'react';
import toast from 'react-hot-toast';

/**
 * GraphQL mutasyonları için özelleştirilmiş hook
 * 
 * @param {Object} mutation - GraphQL mutasyon belgesi
 * @param {Object} options - Mutasyon seçenekleri
 * @param {Function} options.onCompleted - Mutasyon tamamlandığında çağrılacak fonksiyon
 * @param {Function} options.onError - Hata oluştuğunda çağrılacak fonksiyon
 * @param {boolean} options.showSuccessToast - Başarı toast mesajı gösterilsin mi
 * @param {boolean} options.showErrorToast - Hata toast mesajı gösterilsin mi
 * @param {string} options.successMessage - Başarı mesajı
 * @param {Function} options.transform - Sonucu dönüştürmek için fonksiyon
 * @param {Object} options.refetchQueries - Yeniden çekilecek sorgular
 * @returns {Array} Mutasyon fonksiyonu ve sonuç
 */
export function useMutation(mutation, options = {}) {
  const {
    onCompleted,
    onError,
    showSuccessToast = true,
    showErrorToast = true,
    successMessage = 'İşlem başarıyla tamamlandı',
    transform,
    refetchQueries,
    ...restOptions
  } = options;
  
  // Dönüştürülmüş sonucu saklamak için state
  const [transformedData, setTransformedData] = useState(null);
  
  // Apollo Client'ın useMutation hook'unu kullan
  const [mutate, result] = useApolloMutation(mutation, {
    refetchQueries,
    onCompleted: (data) => {
      // Başarı mesajını göster
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      // Sonucu dönüştür
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
  
  // Mutasyon fonksiyonunu saran fonksiyon
  const executeMutation = async (variables, mutationOptions = {}) => {
    try {
      // Yükleniyor toast'ı göster
      let loadingToast;
      if (mutationOptions.showLoadingToast !== false) {
        loadingToast = toast.loading('İşlem gerçekleştiriliyor...');
      }
      
      // Mutasyonu çalıştır
      const { data, errors } = await mutate({
        variables,
        ...mutationOptions,
      });
      
      // Yükleniyor toast'ını kapat
      if (loadingToast) {
        toast.dismiss(loadingToast);
      }
      
      // Hata kontrolü
      if (errors) {
        throw new Error(errors[0].message);
      }
      
      // Sonucu dönüştür
      if (transform && data) {
        const transformed = transform(data);
        setTransformedData(transformed);
        return { data: transformed };
      }
      
      return { data };
    } catch (error) {
      // Hata mesajını göster (eğer otomatik gösterilmediyse)
      if (mutationOptions.showErrorToast !== false && !showErrorToast) {
        toast.error(error.message || 'Bir hata oluştu');
      }
      
      return { error };
    }
  };
  
  return [
    executeMutation,
    {
      ...result,
      data: transform ? transformedData : result.data,
    },
  ];
}

export default useMutation; 