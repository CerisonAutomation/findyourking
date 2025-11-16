import { render, screen } from '@testing-library/react';
import { LoginForm } from '@/components/login-form';

describe('LoginForm', () => {
  it('renders the login form', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });
});
