import { memo, useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Card from '../ui/Card';
import Button from '../ui/Button';
import SectionHeader from '../common/SectionHeader';
import { contactSchema } from '../../schemas/forms';
import { useContactMutation } from '../../hooks/usePortfolioApi';
import { getErrorMessage } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useTrackSectionView } from '../../hooks/useTrackEvent';

const CONTACT_COOLDOWN_MS = 20_000;

const ContactSection = () => {
  const contactMutation = useContactMutation();
  const toast = useToast();
  const { trackClick } = useTrackSectionView('contact');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const form = useForm({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: '',
      email: '',
      message: '',
    },
  });

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCooldownSeconds((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearTimeout(timeoutId);
  }, [cooldownSeconds]);

  const submitContact = useCallback(
    async (payload) => {
      const loadingToastId = toast.loading('Sending your message...');

      try {
        await contactMutation.mutateAsync(payload);
        toast.update(loadingToastId, {
          type: 'success',
          title: 'Message Sent',
          message: 'Thanks for reaching out. I will get back to you soon.',
          persistent: false,
          duration: 3000,
        });
        setCooldownSeconds(Math.ceil(CONTACT_COOLDOWN_MS / 1000));
        form.reset();
      } catch (error) {
        toast.update(loadingToastId, {
          type: 'error',
          title: 'Send Failed',
          message: getErrorMessage(error),
          persistent: false,
          duration: 4000,
        });
      }
    },
    [contactMutation, form, toast]
  );

  const onSubmit = form.handleSubmit(async (values) => {
    if (cooldownSeconds > 0) {
      toast.warning(
        `Please wait ${cooldownSeconds}s before sending another message.`,
        'Cooldown Active'
      );
      return;
    }

    trackClick();
    await submitContact(values);
  });

  return (
    <SectionWrapper id="contact" bgVariant="secondary" className="py-10 sm:py-12">
      <Container>
        <div className="space-y-5">
          <SectionHeader
            eyebrow="Contact"
            title="Start A Collaboration"
            description="Validated contact flow with spam cooldown, retry handling, and status toasts."
          />

          <Card className="border-zinc-800 bg-zinc-950/75 p-3 sm:p-4" hoverEffect={false}>
            <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="contact-name" className="text-sm text-zinc-300">
                  Name
                </label>
                <input
                  id="contact-name"
                  type="text"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600"
                  placeholder="Your name"
                  {...form.register('name')}
                />
                {form.formState.errors.name ? (
                  <p className="text-xs text-zinc-500">{form.formState.errors.name.message}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor="contact-email" className="text-sm text-zinc-300">
                  Email
                </label>
                <input
                  id="contact-email"
                  type="email"
                  className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600"
                  placeholder="you@domain.com"
                  {...form.register('email')}
                />
                {form.formState.errors.email ? (
                  <p className="text-xs text-zinc-500">{form.formState.errors.email.message}</p>
                ) : null}
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label htmlFor="contact-message" className="text-sm text-zinc-300">
                  Message
                </label>
                <textarea
                  id="contact-message"
                  rows={5}
                  className="w-full resize-none rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-600"
                  placeholder="Tell me about your project idea"
                  {...form.register('message')}
                />
                {form.formState.errors.message ? (
                  <p className="text-xs text-zinc-500">{form.formState.errors.message.message}</p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="submit"
                  variant="primary"
                  className="w-full sm:w-auto"
                  disabled={contactMutation.isPending}
                >
                  {contactMutation.isPending ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(ContactSection);
