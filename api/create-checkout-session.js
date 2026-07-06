// api/create-checkout-session.js
// Esta función corre en el servidor (Vercel), nunca en el navegador.
// Recibe el carrito, crea una sesión de pago en Stripe, y devuelve la URL
// para redirigir al comprador a la página de pago oficial de Stripe.

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { items } = req.body; // items = [{ title: "...", price: 1.29 }, ...]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Carrito vacío' });
    }

    const line_items = items.map((item) => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: item.title,
          metadata: { album_code: item.albumCode || 'SIN-ALBUM' },
        },
        unit_amount: Math.round(item.price * 100), // Stripe usa centavos
      },
      quantity: 1,
    }));

    // Códigos de álbum únicos en este carrito, para poder filtrar el reporte por producción
    const albumCodes = [...new Set(items.map((item) => item.albumCode || 'SIN-ALBUM'))].join(',');

    // Descripción legible para que la lista de transacciones en Stripe muestre el nombre real,
    // no un identificador técnico. Ej: "Levántame, Espíritu Santo, Te Entrego Todo"
    let description = items.map((item) => item.title).join(', ');
    if (description.length > 250) description = description.slice(0, 247) + '...';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      metadata: {
        negocio: 'musica-wilfredo-ortiz',
        album_codes: albumCodes,
      },
      payment_intent_data: {
        description: description,
      },
      success_url: `${req.headers.origin}/?compra=exitosa`,
      cancel_url: `${req.headers.origin}/?compra=cancelada`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Error creando sesión de Stripe:', err);
    res.status(500).json({ error: 'No se pudo iniciar el pago' });
  }
};
