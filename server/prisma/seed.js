const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  // ─── Clean existing data ──────────────────────────────────
  await prisma.activityLog.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.event.deleteMany();
  await prisma.user.deleteMany();

  // ─── Create Users ─────────────────────────────────────────
  const hashedPassword = await bcrypt.hash('password123', 10);

  const organizer1 = await prisma.user.create({
    data: {
      name: 'Sarah Chen',
      email: 'organizer@bookit.com',
      password: hashedPassword,
      role: 'ORGANIZER',
    },
  });

  const organizer2 = await prisma.user.create({
    data: {
      name: 'Mike Johnson',
      email: 'organizer2@bookit.com',
      password: hashedPassword,
      role: 'ORGANIZER',
    },
  });

  const users = [];
  const userNames = [
    { name: 'Alice Williams', email: 'user1@bookit.com' },
    { name: 'Bob Martinez', email: 'user2@bookit.com' },
    { name: 'Carol Davis', email: 'user3@bookit.com' },
    { name: 'David Lee', email: 'user4@bookit.com' },
    { name: 'Emma Wilson', email: 'user5@bookit.com' },
  ];

  for (const u of userNames) {
    const user = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashedPassword,
        role: 'USER',
      },
    });
    users.push(user);
  }

  console.log(`✅ Created ${2} organizers and ${users.length} users`);

  // ─── Create Events ────────────────────────────────────────
  const now = new Date();
  const futureDate = (daysFromNow) => {
    const d = new Date(now);
    d.setDate(d.getDate() + daysFromNow);
    return d;
  };
  const pastDate = (daysAgo) => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysAgo);
    return d;
  };

  const eventsData = [
    {
      title: 'JavaScript Conference 2025',
      description:
        'Join us for a deep dive into the latest JavaScript frameworks, tools, and best practices. Featuring talks from industry leaders on React, Node.js, and the future of web development.',
      venue: 'Tech Convention Center, San Francisco',
      date: futureDate(30),
      totalSeats: 200,
      price: 149.99,
      organizerId: organizer1.id,
    },
    {
      title: 'React Summit',
      description:
        'The ultimate React conference featuring workshops on hooks, server components, and state management. Network with fellow React developers and learn from the best.',
      venue: 'Innovation Hub, New York',
      date: futureDate(45),
      totalSeats: 150,
      price: 199.99,
      organizerId: organizer1.id,
    },
    {
      title: 'Node.js Masterclass',
      description:
        'An intensive workshop covering advanced Node.js patterns, performance optimization, microservices architecture, and production best practices.',
      venue: 'DevSpace, Austin',
      date: futureDate(15),
      totalSeats: 50,
      price: 79.99,
      organizerId: organizer1.id,
    },
    {
      title: 'Startup Pitch Night',
      description:
        'Watch 10 exciting startups pitch their ideas to a panel of top VCs. Network with founders, investors, and fellow entrepreneurs over drinks and appetizers.',
      venue: 'The Garage, Palo Alto',
      date: futureDate(7),
      totalSeats: 100,
      price: 25.0,
      organizerId: organizer2.id,
    },
    {
      title: 'AI & Machine Learning Workshop',
      description:
        'Hands-on workshop covering practical AI/ML applications using Python and TensorFlow. Build your first neural network and deploy it to production.',
      venue: 'University Hall, Boston',
      date: futureDate(60),
      totalSeats: 75,
      price: 129.99,
      organizerId: organizer2.id,
    },
    {
      title: 'DevOps Summit 2025',
      description:
        'Everything you need to know about CI/CD, Docker, Kubernetes, and cloud infrastructure. Learn from engineers at top tech companies.',
      venue: 'Cloud Center, Seattle',
      date: futureDate(20),
      totalSeats: 120,
      price: 99.99,
      organizerId: organizer1.id,
    },
    {
      title: 'UX Design Bootcamp',
      description:
        'A 1-day intensive bootcamp on modern UX design principles, Figma workflows, user research methods, and building design systems from scratch.',
      venue: 'Creative Lab, Portland',
      date: futureDate(10),
      totalSeats: 40,
      price: 59.99,
      organizerId: organizer2.id,
    },
    {
      title: 'Cybersecurity Conference',
      description:
        'Stay ahead of threats with talks on ethical hacking, zero-trust architecture, and incident response. Live hacking demos and CTF competitions.',
      venue: 'SecureHQ, Washington DC',
      date: futureDate(35),
      totalSeats: 180,
      price: 175.0,
      organizerId: organizer2.id,
    },
    // Past events (for testing)
    {
      title: 'Web3 Developer Day (Past)',
      description:
        'A day exploring blockchain development, smart contracts, and decentralized applications. This event has already occurred.',
      venue: 'Blockchain Hub, Miami',
      date: pastDate(10),
      totalSeats: 80,
      price: 89.99,
      organizerId: organizer1.id,
    },
    {
      title: 'Open Source Meetup (Past)',
      description:
        'Monthly meetup for open source contributors. Lightning talks, pair programming, and community building. This event has already occurred.',
      venue: 'Community Center, Denver',
      date: pastDate(5),
      totalSeats: 60,
      price: 0.0,
      organizerId: organizer2.id,
    },
  ];

  const events = [];
  for (const eventData of eventsData) {
    const event = await prisma.event.create({
      data: {
        ...eventData,
        availableSeats: eventData.totalSeats,
      },
    });
    events.push(event);
  }

  console.log(`✅ Created ${events.length} events`);

  // ─── Create Bookings ──────────────────────────────────────
  const bookingsData = [
    // User 1 (Alice) books multiple events
    { userId: users[0].id, eventId: events[0].id, status: 'CONFIRMED' },
    { userId: users[0].id, eventId: events[1].id, status: 'CONFIRMED' },
    { userId: users[0].id, eventId: events[3].id, status: 'CONFIRMED' },

    // User 2 (Bob) books and cancels
    { userId: users[1].id, eventId: events[0].id, status: 'CONFIRMED' },
    { userId: users[1].id, eventId: events[2].id, status: 'CANCELLED' },

    // User 3 (Carol) books several
    { userId: users[2].id, eventId: events[0].id, status: 'CONFIRMED' },
    { userId: users[2].id, eventId: events[4].id, status: 'CONFIRMED' },
    { userId: users[2].id, eventId: events[5].id, status: 'CONFIRMED' },

    // User 4 (David)
    { userId: users[3].id, eventId: events[1].id, status: 'CONFIRMED' },
    { userId: users[3].id, eventId: events[3].id, status: 'CONFIRMED' },
    { userId: users[3].id, eventId: events[6].id, status: 'CONFIRMED' },

    // User 5 (Emma)
    { userId: users[4].id, eventId: events[0].id, status: 'CONFIRMED' },
    { userId: users[4].id, eventId: events[2].id, status: 'CONFIRMED' },
    { userId: users[4].id, eventId: events[5].id, status: 'CANCELLED' },
    { userId: users[4].id, eventId: events[7].id, status: 'CONFIRMED' },
  ];

  for (const bookingData of bookingsData) {
    await prisma.booking.create({
      data: {
        ...bookingData,
        cancelledAt:
          bookingData.status === 'CANCELLED' ? new Date() : null,
      },
    });

    // Decrement available seats only for confirmed bookings
    if (bookingData.status === 'CONFIRMED') {
      await prisma.event.update({
        where: { id: bookingData.eventId },
        data: { availableSeats: { decrement: 1 } },
      });
    }
  }

  console.log(`✅ Created ${bookingsData.length} bookings`);

  // ─── Create Activity Logs ─────────────────────────────────
  const activityData = [];

  // Generate EVENT_VIEWED logs
  for (const user of users) {
    for (const event of events.slice(0, 6)) {
      activityData.push({
        userId: user.id,
        eventId: event.id,
        action: 'EVENT_VIEWED',
      });
    }
  }

  // Generate BOOKING_STARTED and BOOKING_CONFIRMED for confirmed bookings
  for (const bd of bookingsData) {
    activityData.push({
      userId: bd.userId,
      eventId: bd.eventId,
      action: 'BOOKING_STARTED',
    });

    if (bd.status === 'CONFIRMED') {
      activityData.push({
        userId: bd.userId,
        eventId: bd.eventId,
        action: 'BOOKING_CONFIRMED',
      });
    } else {
      activityData.push({
        userId: bd.userId,
        eventId: bd.eventId,
        action: 'BOOKING_CONFIRMED',
      });
      activityData.push({
        userId: bd.userId,
        eventId: bd.eventId,
        action: 'BOOKING_CANCELLED',
      });
    }
  }

  await prisma.activityLog.createMany({
    data: activityData,
  });

  console.log(`✅ Created ${activityData.length} activity logs`);

  // ─── Summary ──────────────────────────────────────────────
  console.log('\n🎉 Seed complete!\n');
  console.log('Test credentials:');
  console.log('  Organizer: organizer@bookit.com / password123');
  console.log('  User:      user1@bookit.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
