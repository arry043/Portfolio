import { memo } from 'react';
import { motion as Motion } from 'framer-motion';
import { Code, Award, TrendingUp, Zap } from 'lucide-react';
import SectionWrapper from '../layout/SectionWrapper';
import Container from '../layout/Container';
import Card from '../ui/Card';

const HIGHLIGHTS = [
  {
    platform: 'LeetCode',
    icon: Code,
    stats: '200+ Problems Solved',
    description: 'Data Structures & Algorithms proficiency',
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-500/10',
    borderColor: 'border-yellow-500/20',
  },
  {
    platform: 'GeeksforGeeks',
    icon: Award,
    stats: '250+ Solved, Rank 20',
    description: 'Institute Rank (University Level)',
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
    borderColor: 'border-green-500/20',
  },
  {
    platform: 'Codeforces',
    icon: TrendingUp,
    stats: 'Pupil (Max 1350+)',
    description: 'Competitive Programming milestones',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
    borderColor: 'border-blue-500/20',
  },
  {
    platform: 'CodeChef',
    icon: Zap,
    stats: '3-Star Coder',
    description: 'Participated in Long & Cook-off challenges',
    color: 'text-orange-500',
    bgColor: 'bg-orange-500/10',
    borderColor: 'border-orange-500/20',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

const CodingProfilesHighlights = () => {
  return (
    <SectionWrapper id="coding-profiles" className="py-12 sm:py-20">
      <Container>
        <div className="space-y-10">
          <div className="space-y-3 text-center lg:text-left">
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Coding Profiles & Stats
            </h2>
            <p className="mx-auto max-w-2xl text-sm text-zinc-400 lg:mx-0">
              Showcasing my problem-solving journey across various competitive programming platforms.
            </p>
          </div>

          <Motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          >
            {HIGHLIGHTS.map((profile) => (
              <Motion.div key={profile.platform} variants={itemVariants}>
                <Card
                  className={`h-full border-zinc-800/50 bg-zinc-900/20 p-6 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-800/40`}
                >
                  <div className="space-y-4">
                    <div className={`inline-flex rounded-lg ${profile.bgColor} p-3 ${profile.color}`}>
                      <profile.icon size={24} />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                        {profile.platform}
                      </h3>
                      <p className={`text-lg font-bold tracking-tight ${profile.color}`}>
                        {profile.stats}
                      </p>
                    </div>
                    <p className="text-xs leading-relaxed text-zinc-500">
                      {profile.description}
                    </p>
                  </div>
                </Card>
              </Motion.div>
            ))}
          </Motion.div>
        </div>
      </Container>
    </SectionWrapper>
  );
};

export default memo(CodingProfilesHighlights);
