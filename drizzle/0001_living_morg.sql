CREATE TABLE `bookings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`customerName` varchar(255),
	`customerPhone` varchar(64),
	`customerEmail` varchar(320),
	`serviceType` varchar(128),
	`preferredDate` date,
	`preferredTime` time,
	`duration` int DEFAULT 60,
	`notes` text,
	`status` varchar(32) DEFAULT 'pending',
	`language` varchar(32) DEFAULT 'en',
	`confirmedAt` timestamp,
	`cancelledAt` timestamp,
	`rescheduledFrom` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `bookings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `construction_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`logType` varchar(64) NOT NULL,
	`jobSite` varchar(255),
	`crewMember` varchar(255),
	`content` text NOT NULL,
	`language` varchar(32) DEFAULT 'en',
	`translatedContent` text,
	`jargonTerms` text,
	`status` varchar(32) DEFAULT 'logged',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `construction_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionId` varchar(128) NOT NULL,
	`mode` varchar(32) DEFAULT 'receptionist',
	`language` varchar(32) DEFAULT 'en',
	`title` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `interpreter_sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`sessionType` varchar(32) DEFAULT 'one-on-one',
	`languageA` varchar(32) DEFAULT 'en',
	`languageB` varchar(32) DEFAULT 'es',
	`summary` text,
	`duration` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`endedAt` timestamp,
	CONSTRAINT `interpreter_sessions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255),
	`phone` varchar(64),
	`email` varchar(320),
	`business_type` varchar(128),
	`message` text,
	`language` varchar(32) DEFAULT 'English',
	`source` varchar(64) DEFAULT 'website',
	`status` varchar(32) DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` int NOT NULL,
	`role` varchar(16) NOT NULL,
	`content` text NOT NULL,
	`language` varchar(32) DEFAULT 'en',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`planId` varchar(64) NOT NULL,
	`planName` varchar(128),
	`suite` varchar(64),
	`status` varchar(32) DEFAULT 'active',
	`stripeCustomerId` varchar(128),
	`stripeSubscriptionId` varchar(128),
	`currentPeriodEnd` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `white_label_clients` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ownerId` int,
	`clientName` varchar(255) NOT NULL,
	`businessName` varchar(255),
	`logoUrl` text,
	`primaryColor` varchar(32) DEFAULT '#2563eb',
	`accentColor` varchar(32) DEFAULT '#0ea5e9',
	`planId` varchar(64),
	`status` varchar(32) DEFAULT 'active',
	`aiMode` varchar(32) DEFAULT 'receptionist',
	`sttProvider` varchar(64) DEFAULT 'whisper',
	`llmProvider` varchar(64) DEFAULT 'manus',
	`ttsProvider` varchar(64) DEFAULT 'manus',
	`customDomain` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `white_label_clients_id` PRIMARY KEY(`id`)
);
