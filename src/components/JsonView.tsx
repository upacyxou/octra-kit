interface JsonViewProps {
  label?: string;
  data: unknown;
}

export const JsonView = ({ label, data }: JsonViewProps)=> {
  return (
    <div className="json-view">
      {label ? <h4>{label}</h4> : null}
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};
