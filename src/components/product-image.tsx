/* eslint-disable @next/next/no-img-element */
type ProductImageProps = {
  src: string;
  alt: string;
  className?: string;
};

// 商品图片来自后台填写的外部 URL，统一使用原生 img，避免逐个域名配置 next/image
export function ProductImage({ src, alt, className }: ProductImageProps) {
  return <img src={src} alt={alt} loading="lazy" className={className} />;
}
