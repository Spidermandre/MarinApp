import { Card, Titolo } from '../components/ui';
import { tips } from '../data/tips';

export default function Tips() {
  return (
    <div className="space-y-3">
      <Titolo sub="Le cose che fanno davvero la differenza">Consigli</Titolo>
      {tips.map((t) => (
        <Card key={t.title}>
          <h2 className="font-display text-lg font-extrabold leading-tight">{t.title}</h2>
          <p className="mt-2 text-[15px] leading-relaxed">{t.body}</p>
        </Card>
      ))}
    </div>
  );
}
