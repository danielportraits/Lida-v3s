export default function Logo({ size = 42, className = '' }) {
  return <img className={`lida-logo ${className}`} src={`${import.meta.env.BASE_URL}lida-logo.png`} width={size} height={size} alt="Logo oficial de LIDA" />;
}