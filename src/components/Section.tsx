import type { ReactNode } from 'react';

interface SectionProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export const Section = ({ title, subtitle, children }: SectionProps)=> {
  return (
    <section className="card">
      <div className="card-head">
        <h2>{title}</h2>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      <div className="card-body">{children}</div>
    </section>
  );
};
