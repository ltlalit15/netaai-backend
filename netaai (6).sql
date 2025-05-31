-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: May 31, 2025 at 08:34 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `netaai`
--

-- --------------------------------------------------------

--
-- Table structure for table `ai_chat_history`
--

CREATE TABLE `ai_chat_history` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role` enum('system','user','assistant') NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ai_chat_history`
--

INSERT INTO `ai_chat_history` (`id`, `user_id`, `role`, `content`, `created_at`) VALUES
(1, 3, 'user', 'mango', '2025-05-30 11:19:38'),
(2, 3, 'user', 'mango', '2025-05-30 11:28:53');

-- --------------------------------------------------------

--
-- Table structure for table `chat_history`
--

CREATE TABLE `chat_history` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `role` varchar(10) DEFAULT NULL,
  `content` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `session_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_history`
--

INSERT INTO `chat_history` (`id`, `user_id`, `role`, `content`, `created_at`, `session_id`) VALUES
(1, '3', 'user', 'mango', '2025-05-30 12:30:01', NULL),
(2, '3', 'assistant', 'Mango is a tropical fruit that is known for its sweet and juicy taste. It is commonly eaten on its own or used in a variety of dishes and desserts. Mangoes are rich in vitamins, minerals, and antioxidants, making them a nutritious addition to a balanced diet. They are also a good source of fiber and can help aid digestion. Mangoes come in a variety of different varieties, with each having its own unique flavor and texture.', '2025-05-30 12:30:06', NULL),
(3, 'anonymous_user', 'user', 'What\'s the different between Afci breaker and a Gfci breaker', '2025-05-30 12:40:46', NULL),
(4, 'anonymous_user', 'assistant', 'AFCI (Arc Fault Circuit Interrupter) breakers and GFCI (Ground Fault Circuit Interrupter) breakers are both designed to protect against electrical hazards, but they serve different purposes.\n\nAFCI breakers protect against arc faults, which occur when an electrical current jumps from one wire to another, potentially causing a fire. These types of faults are often caused by damaged wiring or appliances. AFCI breakers are typically used in bedrooms, living rooms, and other areas where fire hazards are a concern.\n\nGFCI breakers, on the other hand, protect against ground faults, which occur when a current flows from a grounded conductor to an unintended path, such as through water or a person\'s body. This type of fault can result in electrical shock or electrocution. GFCI breakers are commonly used in bathrooms, kitchens, outdoor outlets, and other areas where water is present.\n\nIn summary, AFCI breakers protect against fire hazards caused by arc faults, while GFCI breakers protect against electrical shock hazards caused by ground faults.', '2025-05-30 12:40:52', NULL),
(5, '3', 'user', 'KK\n', '2025-05-30 12:46:39', NULL),
(6, '3', 'assistant', 'Hello! How can I assist you today?', '2025-05-30 12:46:42', NULL),
(7, '3', 'user', 'DSSSF', '2025-05-30 12:46:50', NULL),
(8, '3', 'assistant', 'Hello! How can I help you with DSSSF?', '2025-05-30 12:46:54', NULL),
(9, '3', 'user', 'sdfsdf', '2025-05-30 12:49:32', NULL),
(10, '3', 'assistant', 'Hello! How can I assist you today?', '2025-05-30 12:49:35', NULL),
(11, '3', 'user', 'asdas', '2025-05-30 12:49:47', NULL),
(12, '3', 'assistant', 'Hello! How can I assist you today?', '2025-05-30 12:49:51', NULL),
(13, '3', 'user', 'tell me about apple\n', '2025-05-30 12:58:54', NULL),
(14, '3', 'assistant', 'Apple Inc. is an American multinational technology company that was founded by Steve Jobs, Steve Wozniak, and Ronald Wayne on April 1, 1976. The company is headquartered in Cupertino, California and is known for designing, manufacturing, and selling consumer electronics, software, and services.\n\nApple is best known for its popular products such as the iPhone, iPad, Mac computers, Apple Watch, and AirPods. The company also develops its own software including the macOS operating system, iOS mobile operating system, and the iTunes media player.\n\nIn addition to hardware and software products, Apple offers various services such as Apple Music, iCloud, Apple Pay, and the App Store. The company is also known for its retail stores, called Apple Stores, which offer customers a unique and interactive shopping experience.\n\nApple is one of the most valuable and profitable companies in the world and is known for its innovative and user-friendly products. The company has a loyal customer base and a strong brand presence in the tech industry.', '2025-05-30 12:58:58', NULL),
(15, '3', 'user', 'What\'s the different between Afci breaker and a Gfci breaker', '2025-05-30 13:27:29', NULL),
(16, '3', 'assistant', 'AFCI (Arc Fault Circuit Interrupter) and GFCI (Ground Fault Circuit Interrupter) breakers are both types of electrical safety devices that protect against electrical fires and shocks, but they serve slightly different purposes.\n\nAFCI breakers are designed to protect against electrical fires caused by arc faults, which can occur when there is a loose or damaged wire in the electrical system. AFCI breakers detect these dangerous faults and immediately interrupt the flow of electricity to prevent a fire from starting.\n\nGFCI breakers, on the other hand, are designed to protect against electrical shocks caused by ground faults, which occur when electrical current leaks from a circuit and flows through a person or object. GFCI breakers quickly shut off power to the circuit when they detect a ground fault, preventing electrical shocks and reducing the risk of electrical fires.\n\nIn summary, AFCI breakers protect against electrical fires caused by arc faults, while GFCI breakers protect against electrical shocks caused by ground faults. Both types of breakers play an important role in ensuring electrical safety in homes and buildings.', '2025-05-30 13:27:34', NULL),
(17, '3', 'user', '⁠Can I use Romex wire in a commercial job', '2025-05-30 13:27:48', NULL),
(18, '3', 'assistant', 'No, Romex wire is typically not approved for use in commercial applications. Commercial wiring must adhere to stricter codes and regulations, and usually requires the use of specialty wiring such as THHN or THWN wire. It is recommended to consult with a licensed electrician or building inspector to determine the appropriate type of wiring for a commercial job.', '2025-05-30 13:27:51', NULL),
(19, '3', 'user', '⁠Can I use Romex wire in a commercial job', '2025-05-30 18:47:51', NULL),
(20, '3', 'assistant', 'It is generally not recommended to use Romex wire in commercial applications as it may not meet the necessary safety and building code requirements for commercial buildings. It is important to consult with a qualified electrician or building inspector to determine the appropriate wiring materials for your specific commercial project. Using the wrong type of wire could create safety hazards and result in code violations.', '2025-05-30 18:47:54', NULL),
(21, '3', 'user', 'What\'s the different between Afci breaker and a Gfci breaker', '2025-05-30 18:57:22', NULL),
(22, '3', 'assistant', 'AFCI (Arc Fault Circuit Interrupter) and GFCI (Ground Fault Circuit Interrupter) are both types of circuit breakers that help protect against electrical faults, but they serve different purposes:\n\n1. AFCI Breaker: AFCI breakers are designed to protect against arc faults, which can occur when there is a loose or damaged wire in an electrical circuit. Arc faults can cause fires, so AFCI breakers are important for fire prevention. These breakers continuously monitor the electrical current in a circuit and trip if they detect an arc fault.\n\n2. GFCI Breaker: GFCI breakers are designed to protect against ground faults, which occur when an electrical current strays from its intended path and flows through the body of a person who comes into contact with it. GFCI breakers monitor the flow of current in a circuit and trip if they detect a ground fault. They are commonly used in areas where water is present, such as bathrooms, kitchens, and outdoor outlets.\n\nIn summary, AFCI breakers protect against arc faults to prevent fires, while GFCI breakers protect against ground faults to prevent electric shocks. Both types of breakers are important for electrical safety in a home or building.', '2025-05-30 18:57:27', NULL),
(23, '3', 'user', 'gbb', '2025-05-30 19:40:30', NULL),
(24, '3', 'assistant', 'Hello! How can I assist you today?', '2025-05-30 19:40:31', NULL),
(25, '3', 'user', 'vj', '2025-05-30 19:49:32', 1),
(26, '3', 'assistant', 'Hello! How can I assist you today?', '2025-05-30 19:49:33', 1),
(27, '3', 'user', ' kj', '2025-05-30 19:50:03', 1),
(28, '3', 'assistant', 'Hello! How can I assist you today?', '2025-05-30 19:50:04', 1),
(29, '3', 'user', 'what are you doing', '2025-05-30 19:50:16', 1),
(30, '3', 'assistant', 'I am here to assist you. How can I help you today?', '2025-05-30 19:50:17', 1),
(31, '3', 'user', 'mango', '2025-05-30 19:50:25', 1),
(32, '3', 'assistant', 'A mango is a tropical fruit that is sweet and juicy. It has a smooth skin and a large seed in the center. Mangos are typically eaten fresh, but they can also be used in smoothies, salads, and desserts. They are rich in vitamins and antioxidants, making them a healthy snack option.', '2025-05-30 19:50:27', 1),
(33, '3', 'user', 'What\'s the different between Afci breaker and a Gfci breaker', '2025-05-31 05:23:40', 3),
(34, '3', 'assistant', 'AFCI (Arc Fault Circuit Interrupter) and GFCI (Ground Fault Circuit Interrupter) breakers are both types of electrical safety devices that help protect against electrical fires and shocks, but they serve different purposes and protect against different types of faults.\n\n1. AFCI Breaker:\n- AFCI breakers are designed to detect and prevent electrical arcs, which can occur when there is a loose or damaged wire in an electrical circuit.\n- They help prevent electrical fires by quickly shutting off power to the circuit when an arc fault is detected.\n- AFCI breakers are typically required in bedrooms, living rooms, and other living areas to comply with modern electrical codes.\n- They do not protect against ground faults or current leakage.\n\n2. GFCI Breaker:\n- GFCI breakers are designed to detect ground faults or current leakage in an electrical circuit.\n- They help prevent electric shocks by quickly shutting off power to the circuit if a ground fault is detected, such as when someone accidentally touches a live wire.\n- GFCI breakers are typically required in wet or damp locations like bathrooms, kitchens, outdoor areas, and garages to comply with electrical safety standards.\n- They do not protect against arc faults.\n\nIn summary, AFCI breakers protect against arc faults that can cause fires, while GFCI breakers protect against ground faults that can cause shocks. Both types of breakers are important for ensuring electrical safety in homes and buildings.', '2025-05-31 05:23:46', 3),
(35, '3', 'user', 'What slice of wire do I need for a 50 amp oven', '2025-05-31 05:24:03', 5),
(36, '3', 'assistant', 'To determine the proper gauge of wire needed for a 50 amp oven, you should consult the National Electrical Code (NEC) guidelines. According to the NEC, a 50 amp oven typically requires a 6-gauge wire for the circuit. It is important to use the appropriate gauge of wire to ensure safe and efficient operation of the appliance.', '2025-05-31 05:24:06', 5),
(37, '3', 'user', '⁠Can I use Romex wire in a commercial job', '2025-05-31 05:24:14', 5),
(38, '3', 'assistant', 'It is generally not recommended to use Romex wire in a commercial job because it is not rated for commercial use and may not meet the specific building code requirements for commercial installations. It is important to use the appropriate type of wire that is rated for commercial use and meets all applicable safety standards. It is recommended to consult with a licensed electrician or building inspector to determine the correct type of wire to use for your specific commercial project.', '2025-05-31 05:24:18', 5),
(39, '3', 'user', 'apple', '2025-05-31 05:29:40', 7),
(40, '3', 'assistant', 'An apple is a type of fruit that is typically round in shape and vary in color from green to red. It is a popular and nutritious snack that is high in fiber, vitamins, and antioxidants. Apples can be eaten raw, used in cooking and baking, or juiced to make apple cider.', '2025-05-31 05:29:45', 7);

-- --------------------------------------------------------

--
-- Table structure for table `chat_sessions`
--

CREATE TABLE `chat_sessions` (
  `id` int(11) NOT NULL,
  `user_id` varchar(255) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `chat_sessions`
--

INSERT INTO `chat_sessions` (`id`, `user_id`, `title`, `created_at`) VALUES
(1, '3', 'Chat on 5/31/2025, 1:19:32 AM', '2025-05-30 19:49:32'),
(2, '3', 'Chat on 5/31/2025, 10:53:31 AM', '2025-05-31 05:23:32'),
(3, '3', 'Chat on 5/31/2025, 10:53:31 AM', '2025-05-31 05:23:32'),
(4, '3', 'Chat on 5/31/2025, 10:53:53 AM', '2025-05-31 05:23:53'),
(5, '3', 'Chat on 5/31/2025, 10:53:53 AM', '2025-05-31 05:23:53'),
(6, '3', 'Chat on 5/31/2025, 10:54:29 AM', '2025-05-31 05:24:30'),
(7, '3', 'Chat on 5/31/2025, 10:54:29 AM', '2025-05-31 05:24:30');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(255) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `referredBy` varchar(255) NOT NULL,
  `tokenVersion` int(11) NOT NULL DEFAULT 0,
  `organization_name` varchar(255) NOT NULL,
  `website` varchar(255) NOT NULL,
  `number_of_electricians` int(11) NOT NULL,
  `supplies_source` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `license_number` varchar(255) NOT NULL,
  `referral` varchar(255) NOT NULL,
  `image` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `full_name`, `email`, `password`, `referredBy`, `tokenVersion`, `organization_name`, `website`, `number_of_electricians`, `supplies_source`, `address`, `license_number`, `referral`, `image`) VALUES
(3, 'Ankit', 'ankit@gmail.com', '$2a$10$1LVenGnYZz7zi0eGUbAMG.LePt37puISCf2iK89nlUw.NB.JEdMny', '', 5, 'gfnfhn gn ', 'http://localhost:5173/settingspage', 11, 'frgrbfbf', 'dcdv', 'qqqqwee', 'csdc', 'https://res.cloudinary.com/dkqcqrrbp/image/upload/v1748596741/uploads/t1c2ztp3lztak3akzfm5.jpg'),
(5, 'Amit', 'amit@gmail.com', '$2a$10$YRmpy01nqqCPR0XM64dNEe3G0o5IrmHKGm3pc64owsEgqFiAj2aW6', 'Rohan', 0, '', '', 0, '', '', '', '', '');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `ai_chat_history`
--
ALTER TABLE `ai_chat_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `chat_history`
--
ALTER TABLE `chat_history`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `chat_sessions`
--
ALTER TABLE `chat_sessions`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `ai_chat_history`
--
ALTER TABLE `ai_chat_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `chat_history`
--
ALTER TABLE `chat_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- AUTO_INCREMENT for table `chat_sessions`
--
ALTER TABLE `chat_sessions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(255) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `ai_chat_history`
--
ALTER TABLE `ai_chat_history`
  ADD CONSTRAINT `ai_chat_history_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
