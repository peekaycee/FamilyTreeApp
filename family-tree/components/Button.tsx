import styles from './components.module.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tag: string;
}

export default function Button({
  tag,
  onClick,
  // disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      // disabled={disabled}
      type={type}
      {...rest}
    >
      {tag}
    </button>
  );
}