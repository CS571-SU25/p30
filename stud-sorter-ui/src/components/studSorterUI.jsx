import Button from 'react-bootstrap/Button';

export default function App() {
  return (
    <div className="p-4">
      <h1 className="mb-3">Stud Sorter UI</h1>
      <Button variant="primary" onClick={() => alert("Test react-bootstrap works")}>
        Test Button
      </Button>
    </div>
  );
}
