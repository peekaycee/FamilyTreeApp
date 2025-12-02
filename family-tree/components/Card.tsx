import styles from "./components.module.css";

export default function Card({ title, subtitle, img }: any) {
  return (
    <div className={styles.card}>
      <img src={img || "/placeholder.png"} alt={title} />
      <h3>{title}</h3>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
